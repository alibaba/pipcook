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

// default PNR(Plugin Not Responding) timeout.
const defaultPluginNotRespondingTimeout = 10 * 1000;

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
   * PNR(Plugin Not Responding) timeout.
   */
  pluginNotRespondingTimeout?: number;
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
  // PNR(Plugin Not Responding) timeout.
  private pluginNotRespondingTimeout: number = defaultPluginNotRespondingTimeout;

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
    if (arg.pluginNotRespondingTimeout) {
      this.pluginNotRespondingTimeout = arg.pluginNotRespondingTimeout;
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
    debug('set the runnable state to busy.');

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
    debug(`file system is ready, start running the plugin(${pkg.name}).`);

    // wrap the PNR with the start logic.
    const resp = await new Promise<PluginMessage>((resolve, reject) => {
      const notRespondingTimer = setTimeout(() => {
        this.state = 'error';
        this.handle.kill('SIGKILL');
        return reject(new TypeError('plugin not responding.'));
      }, this.pluginNotRespondingTimeout);

      // start sending the "start" message.
      this.sendAndWait(PluginOperator.WRITE, {
        event: 'start',
        params: [
          pkg,
          ...args
        ]
      }, (state: string) => {
        // clear the PNR timer if received the "plugin loaded" message.
        if (state === 'plugin loaded') {
          clearTimeout(notRespondingTimer);
          debug('plugin is loaded.');
        }
      }).then(
        (res: PluginMessage) => {
          debug('received the plugin response.');
          // clear the not responding timer when the "pong" is done.
          clearTimeout(notRespondingTimer);
          resolve(res);
        },
        (err: Error) => {
          debug(`received an error ${err} when running the plugin.`);
          // clear the not responding timer if something went wrong.
          clearTimeout(notRespondingTimer);
          reject(err);
        }
      );
    });
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
    if (this.queue.length >= 1) {
      return this.queue.pop();
    }
    return new Promise((resolve, reject) => {
      const clearReadCallbacks = () => {
        this.onread = undefined;
        this.onreadfail = undefined;
        this.awaitingMessage = false;
      };
      this.onread = (proto: PluginProtocol) => {
        clearReadCallbacks();
        resolve(proto);
      };
      this.onreadfail = (err: Error) => {
        clearReadCallbacks();
        reject(err);
      };
      this.awaitingMessage = true;
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
  private async sendAndWait(op: PluginOperator, msg: PluginMessage, handler?: (s: string) => void): Promise<PluginMessage> {
    await this.send(op, msg);
    debug(`sent ${msg.event} for ${this.id}, and wait for response`);

    let resp = null;
    do {
      const data = await this.waitOn(op);
      const { event } = data;
      debug(`received an event ${event} from ${this.id}.`);

      if (event === 'emit') {
        if (typeof handler === 'function') {
          handler(data.params[0] as string);
        }
      } else {
        if (event !== 'pong') {
          throw new TypeError('invalid response because the event is not "pong".');
        }
        resp = data;
        break;
      }
    } while (resp === null);
    return resp;
  }
  /**
   * handle the messages from peer client.
   * @param msg
   */
  private handleMessage(msg: string) {
    debug('recv a raw message', msg);
    const proto = PluginProtocol.parse(msg);
    if (this.awaitingMessage && typeof this.onread === 'function') {
      return this.onread(proto);
    }
    this.queue.push(proto);
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
