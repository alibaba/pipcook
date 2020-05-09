import * as uuid from 'uuid';
import path from 'path';
import { ensureDir, ensureSymlink, remove } from 'fs-extra';
import { fork, ChildProcess } from 'child_process';
import { PluginProto, PluginOperator, PluginMessage, PluginResponse } from './proto';
import { PluginRT, PluginPackage } from './index';
import Debug from 'debug';

const debug = Debug('costa.runnable');

class RunnableResponse implements PluginResponse {
  public id: string;
  public __flag__ = '__pipcook_plugin_runnable_result__';
  constructor(id: string) {
    this.id = id;
  }
}

interface BootstrapArg {
  customEnv: Record<string, string>;
}

export class PluginRunnable {
  private id: string = uuid.v4();
  private rt: PluginRT;
  private handle: ChildProcess = null;
  private state: 'init' | 'idle' | 'busy';
  private readable: Function | null;

  /**
   * the current working directory for this runnable.
   */
  public workingDir: string;

  constructor(rt: PluginRT) {
    this.rt = rt;
    this.workingDir = path.join(this.rt.config.componentDir, this.id);
    this.state = 'init';
  }
  /**
   * Do bootstrap the runnable client.
   */
  async bootstrap(arg: BootstrapArg): Promise<void> {
    const compPath = this.workingDir;
    await ensureDir(compPath);
    await ensureDir(compPath + '/node_modules');

    debug(`bootstrap a new process for ${this.id}`);
    this.handle = fork(__dirname + '/client', [], {
      stdio: 'inherit',
      cwd: compPath,
      env: Object.assign({}, process.env, arg.customEnv)
    });
    this.handle.on('message', this.handleMessage.bind(this));
    this.handle.once('disconnect', this.afterDestroy.bind(this));

    // send the first message as handshaking with client
    const ret = await this.handshake();
    if (!ret) {
      throw new TypeError(`created runnable "${this.id}" failed.`);
    }
    this.state = 'idle';
  }
  /**
   * Do send handshake message to runnable client, and wait for response.
   */
  async handshake(): Promise<boolean> {
    this.send(PluginOperator.START, {
      event: 'handshake',
      params: [ this.id ]
    });
    debug(`sent handshake for ${this.id} and waiting for client response.`);

    await this.waitOn(PluginOperator.START);
    return true;
  }
  /**
   * Wait for the next operator util receiving.
   * @param op operator to wait.
   */
  async waitOn(op: PluginOperator): Promise<PluginMessage> {
    let cur, msg;
    do {
      const data = await this.read();
      cur = data.op;
      msg = data.message;
    } while (cur !== op);
    return msg;
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

    const { installDir, componentDir } = this.rt.config;
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

    await this.write({
      event: 'start',
      params: [
        pkg,
        ...args
      ]
    });
    const resp = await this.waitOn(PluginOperator.WRITE);
    this.state = 'idle';

    // return if the result id is provided.
    const id = resp.params[0];
    return id ? new RunnableResponse(id) : null;
  }
  async destroy(): Promise<void> {
    this.write({ event: 'destroy' });
  }
  async afterDestroy(): Promise<void> {
    debug(`the runnable(${this.id}) has been destroyed.`);
    await remove(path.join(this.rt.config.componentDir, this.id));
  }
  send(code: number, msg?: PluginMessage): boolean {
    const data = PluginProto.stringify(code, msg);
    return this.handle.send(data);
  }
  write(data: PluginMessage): boolean {
    return this.send(PluginOperator.WRITE, data);
  }
  async read(): Promise<PluginProto> {
    return new Promise((resolve) => {
      this.readable = resolve;
    });
  }
  handleMessage(msg: string) {
    const proto = PluginProto.parse(msg) as PluginProto;
    if (typeof this.readable === 'function') {
      this.readable(proto);
    }
  }
}
