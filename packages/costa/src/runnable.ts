import * as path from 'path';
import { ensureDir, ensureSymlink } from 'fs-extra';
import { fork, ChildProcess } from 'child_process';
import { PluginProtocol, PluginOperator, PluginMessage, PluginResponse } from './protocol';
import { CostaRuntime, PluginPackage } from './runtime';
import { pipeLog, LogStdio } from './utils';
import Debug from 'debug';
import { generateId } from '@pipcook/pipcook-core';
const debug = Debug('costa.runnable');

/**
 * Returns when called `start()`
 */
export class RunnableResponse implements PluginResponse {
  public id: string;
  public __flag__ = '__pipcook_plugin_runnable_result__';
  constructor(id: string) {
    this.id = id;
  }
}

// wait 1000ms for chile process finish.
const waitForDestroyed = 1000;

// default PLNR(Plugin Load Not Responding) timeout.
const defaultPluginLoadNotRespondingTimeout = 10 * 1000;

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

  // private events
  private onread: Function | null;
  private onreadfail: Function | null;
  private ondestroyed: Function | null;

  // private states
  private queue: PluginProtocol[] = [];
  private awaitingMessage = false;

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
    await ensureDir(compPath + '/node_modules');

    debug(`bootstrap a new process for ${this.id}.`);
    this.handle = fork(__dirname + '/client/entry', [], {
      stdio: [ process.stdin, 'pipe', 'pipe', 'ipc' ],
      cwd: compPath,
      silent: true,
      env: Object.assign({}, process.env, arg.customEnv)
    });
    pipeLog(this.handle.stdout, this.logger.stdout);
    pipeLog(this.handle.stderr, this.logger.stderr);
    this.handle.on('message', this.handleMessage.bind(this));
    this.handle.once('exit', this.afterDestroy.bind(this));

    // send the first message as handshaking with client
    const ret = await this.handshake();
    if (!ret) {
      throw new TypeError(`created runnable "${this.id}" failed.`);
    }
    this.state = 'idle';
  }
  /**
   * Get the runnable value for the given response.
   * @param resp the value to the response.
   */
  async valueOf(resp: RunnableResponse): Promise<object> {
    const msg = await this.sendAndWait(PluginOperator.READ, {
      event: 'deserialize response',
      params: [
        resp
      ]
    });
    if (!msg.params || msg.params.length !== 1) {
      throw new TypeError('invalid response because the params is invalid.');
    }
    return JSON.parse(msg.params[0]);
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
    await this.sendAndWait(PluginOperator.WRITE, {
      event: 'load',
      params: [ pkg ]
    }, this.pluginLoadNotRespondingTimeout);

    // when the `load` is complete, start the plugin.
    debug(`loaded the plugin(${pkg.name}), start it at ${this.id}.`);
    const resp = await this.sendAndWait(PluginOperator.WRITE, {
      event: 'start',
      params: [
        pkg,
        ...args
      ]
    });

    // start is end, now set it to idle.
    this.state = 'idle';

    // return if the result id is provided.
    const id = resp.params[0];
    if (id === 'error') {
      throw new TypeError(resp.params[1]);
    }
    return id ? new RunnableResponse(id) : null;
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
    await this.send(PluginOperator.WRITE, { event: 'destroy' });
    return new Promise((resolve) => {
      this.ondestroyed = resolve;
    });
  }
  /**
   * Send a message with operator.
   * @param op
   * @param msg
   */
  private send(op: PluginOperator, msg?: PluginMessage): Promise<void> {
    const data = PluginProtocol.stringify(op, msg);
    return new Promise<void>((resolve, reject) => {
      const success = this.handle.send(data, (err) => {
        err ? reject(err) : resolve();
      });
      // if the message queue is full, the result will be false,
      // and the callback will never been called,
      // so we need to throw the error here
      if (!success) {
        reject(new Error('subprocess send failed'));
      }
    });
  }
  /**
   * Reads the message, it's blocking the async context util.
   */
  private async read(): Promise<PluginProtocol> {
    return new Promise((resolve, reject) => {
      this.onread = resolve;
      this.onreadfail = reject;
    });
  }
  /**
   * Do send handshake message to runnable client, and wait for response.
   */
  private async handshake(): Promise<boolean> {
    const msg = await this.sendAndWait(PluginOperator.START, {
      event: 'handshake',
      params: [ this.id ]
    });
    return !!msg;
  }
  /**
   * Wait for the next operator util receiving.
   * @param op operator to wait.
   */
  private async waitOn(op: PluginOperator): Promise<PluginMessage> {
    let cur, msg;
    debug(`wait on the next op is: ${op}`);
    do {
      const data = await this.read();
      cur = data.op;
      msg = data.message;
    } while (cur !== op);
    return msg;
  }
  /**
   * Send an operator with message, and waits for the response.
   * @param op
   * @param msg
   */
  private async sendAndWait(op: PluginOperator, msg: PluginMessage, timeout?: number): Promise<PluginMessage> {
    return new Promise<PluginMessage>((resolve, reject) => {
      let opNotRespondingTimer: NodeJS.Timer;
      if (typeof timeout === 'number' && timeout > 0) {
        opNotRespondingTimer = setTimeout(() => {
          this.state = 'error';
          this.handle.kill('SIGKILL');
          return reject(new TypeError(`send op(${op}) not responding over ${timeout}ms.`));
        }, timeout);
      }

      debug(`start sending ${msg.event} for ${this.id}, and wait for response`);
      return Promise.all([
        this.send(op, msg),
        this.waitOn(op)
      ])
        .then(([ , data ]) => {
          debug(`received an event ${data.event} from ${this.id}.`);
          if (data.event !== 'pong') {
            throw new TypeError('invalid response because the event is not "pong".');
          }
          clearTimeout(opNotRespondingTimer);
          resolve(data);
        })
        .catch((err: Error) => {
          clearTimeout(opNotRespondingTimer);
          reject(err);
        });
    });
  }
  /**
   * handle the messages from peer client.
   * @param msg
   */
  private handleMessage(msg: string) {
    debug('recv a raw message', msg);
    const proto = PluginProtocol.parse(msg);
    if (typeof this.onread === 'function') {
      this.onread(proto);
    }
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
    if (typeof this.onread === 'function' && typeof this.onreadfail === 'function') {
      this.onreadfail(new TypeError(`costa runtime is destroyed(${signal}).`));
    }
    if (typeof this.ondestroyed === 'function') {
      this.ondestroyed();
    }
  }
}
