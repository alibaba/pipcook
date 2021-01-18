import * as path from 'path';
import { ensureDir, ensureSymlink } from 'fs-extra';
import { fork, ChildProcess } from 'child_process';
// import { IPCInput, IPCOutput } from './protocol';
import { CostaRuntime, PluginPackage } from './runtime';
import { pipeLog, LogStdio } from './utils';
import Debug from 'debug';
import { generateId } from '@pipcook/pipcook-core';
import { IPCProxy } from './ipc-proxy';
const debug = Debug('costa.runnable');

// wait 1000ms for chile process finish.
const waitForDestroyed = 1000;

// default PLNR(Plugin Load Not Responding) timeout.
const defaultPluginLoadNotRespondingTimeout = 10 * 1000;
export interface RunnableResponse {
  id: string;
}
/**
 * The arguments for calling `bootstrap`.
 */
export interface BootstrapArg {
  /**
   * Add extra environment variables.
   */
  customEnv?: Record<string, string>;
  /**
   * The runnable id.
   */
  id?: string;
  /**
   * the logger
   */
  logger?: LogStdio;
  /**
   * the timeout to not responding when loading the plugin.
   */
  pluginLoadNotRespondingTimeout?: number;
}

/**
 * The runnable is to represent a container to run plugins.
 */
export class PluginRunnable {
  private rt: CostaRuntime;
  private handle: ChildProcess = null;
  private ipcProxy: IPCProxy = null;

  // private events
  private ondestroyed: () => void;

  // timer for wait the process to exit itself
  private notRespondingTimer: NodeJS.Timeout;
  private pluginLoadNotRespondingTimeout: number = defaultPluginLoadNotRespondingTimeout;

  /**
   * The runnable id.
   */
  public id: string;

  /**
   * the current working directory for this runnable.
   */
  public workingDir: string;

  /**
   * the current data directory for this runnable
   */
  public dataDir: string;

  /**
   * The current state.
   */
  public state: 'init' | 'idle' | 'busy' | 'error';

  /**
   * The flag somebody stop running
   */
  public canceled: boolean;

  /**
   * logger
   */
  private logger: LogStdio;
  /**
   * Create a runnable by the given runtime.
   * @param rt the costa runtime.
   */
  constructor(rt: CostaRuntime, logger?: LogStdio, id?: string) {
    this.id = id || generateId();
    this.rt = rt;
    this.workingDir = path.join(this.rt.options.componentDir, this.id);
    this.dataDir = path.join(this.workingDir, 'data');
    this.state = 'init';
    this.logger = logger || process;
  }
  /**
   * Do bootstrap the runnable client.
   */
  async bootstrap(arg: BootstrapArg): Promise<void> {
    const compPath = this.workingDir;
    if (arg.pluginLoadNotRespondingTimeout) {
      this.pluginLoadNotRespondingTimeout = arg.pluginLoadNotRespondingTimeout;
    }

    debug(`make sure the component dir is existed.`);
    await Promise.all([ ensureDir(compPath + '/node_modules'), ensureDir(this.dataDir) ]);

    debug(`bootstrap a new process for ${this.id}.`);
    this.handle = fork(__dirname + '/client/entry', [], {
      stdio: [ process.stdin, 'pipe', 'pipe', 'ipc' ],
      cwd: compPath,
      silent: true,
      env: Object.assign({}, process.env, arg.customEnv)
    });
    pipeLog(this.handle.stdout, this.logger.stdout);
    pipeLog(this.handle.stderr, this.logger.stderr);
    this.handle.once('exit', this.afterDestroy.bind(this));
    this.ipcProxy = new IPCProxy(this.handle);
    // send the first message as handshaking with client
    const ret = await this.ipcProxy.call('handshake');
    if (!ret) {
      throw new TypeError(`created runnable "${this.id}" failed.`);
    }
    this.state = 'idle';
  }
  /**
   * Get the runnable value for the given response.
   * @param resp the value to the response.
   */
  async valueOf(resp: RunnableResponse): Promise<any> {
    return await this.ipcProxy.call('valueOf', [ resp.id ]);
  }
  /**
   * Do start from a specific plugin.
   * @param name the plguin name.
   */
  async start(pkg: PluginPackage, ...args: any[]): Promise<RunnableResponse | null> {
    if (this.state !== 'idle') {
      throw new TypeError(`the runnable "${this.id}" is busy or not ready now`);
    }
    this.state = 'busy';

    const { installDir, componentDir } = this.rt.options;
    const compPath = path.join(componentDir, this.id);
    const nameSchema = path.parse(pkg.name);

    await ensureDir(compPath);
    await ensureDir(compPath + '/node_modules');
    if (nameSchema.dir) {
      await ensureDir(compPath + `/node_modules/${nameSchema.dir}`);
    }

    // prepare boa and miniconda environment
    await ensureSymlink(
      path.join(installDir, 'node_modules', pkg.name),
      compPath + `/node_modules/${pkg.name}`);

    // log all the requirements are ready to tell the debugger it's going to run.
    debug(`env is ready, start loading the plugin(${pkg.name}) at ${this.id}.`);
    await this.ipcProxy.call('load', [ pkg ], this.pluginLoadNotRespondingTimeout);
    // when the `load` is complete, start the plugin.
    debug(`loaded the plugin(${pkg.name}), start it at ${this.id}.`);
    const valueId = await this.ipcProxy.call('start', [ pkg, ...args ], 0);
    
    // start is end, now set it to idle.
    this.state = 'idle';

    // return if the result id is provided.
    return valueId ? { id: valueId } : null;
  }
  /**
   * Destroy this runnable, this will kill process, and get notified on `afterDestory()`.
   */
  async destroy(): Promise<void> {
    if (!this.handle.connected) {
      return;
    }
    this.canceled = true;
    // if not exit after `waitForDestroied`, we need to kill it directly.
    this.notRespondingTimer = setTimeout(() => {
      this.state = 'error';
      this.handle.kill('SIGKILL');
    }, waitForDestroyed);
    // await this.send(PluginOperator.WRITE, { event: 'destroy' });
    try {
      await this.ipcProxy.call('destory', undefined, waitForDestroyed);
    } catch (err) {
      this.state = 'error';
      this.ipcProxy.destory();
    }
    return new Promise((resolve) => {
      this.ondestroyed = resolve;
    });
  }
  /**
   * Fired when the peer client is exited.
   */
  private async afterDestroy(code: number, signal: NodeJS.Signals): Promise<void> {
    debug(`the runnable(${this.id}) has been destroyed with(code=${code}, signal=${signal}).`);
    if (this.notRespondingTimer) {
      clearTimeout(this.notRespondingTimer);
      this.notRespondingTimer = null;
    }
    // FIXME(Yorkie): remove component directory?
    // await remove(path.join(this.rt.options.componentDir, this.id));
    // if (typeof this.onread === 'function' && typeof this.onreadfail === 'function') {
    //   this.onreadfail(new TypeError(`costa runtime is destroyed(${signal}).`));
    // }
    if (typeof this.ondestroyed === 'function') {
      this.ondestroyed();
    }
  }
}
