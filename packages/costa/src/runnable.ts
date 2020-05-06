import * as uuid from 'uuid';
import path from 'path';
import { ensureDir, ensureSymlink, remove } from 'fs-extra';
import { fork, ChildProcess } from 'child_process';
import { PluginProto, PluginOperator, PluginMessage } from './proto';
import { PluginRT } from './index';
import Debug from 'debug';

const debug = Debug('costa.runnable');

export class PluginRunnable {
  private id: string = uuid.v4();
  private rt: PluginRT;
  private handle: ChildProcess = null;
  private readable: Function | null;

  constructor(rt: PluginRT) {
    this.rt = rt;
  }
  /**
   * Bootstrap for specific plugin.
   * @param name the plguin name.
   */
  async bootstrap(name: string): Promise<void> {
    const { installDir, componentDir } = this.rt.config;
    const compPath = path.join(componentDir, this.id);
    const nameSchema = path.parse(name);

    await ensureDir(compPath);
    await ensureDir(compPath + '/node_modules');
    if (nameSchema.dir) {
      await ensureDir(compPath + `/node_modules/${nameSchema.dir}`);
    }

    // prepare boa and miniconda environment
    await ensureSymlink(
      path.join(installDir, 'node_modules', name),
      compPath + `/node_modules/${name}`);

    this.handle = fork(__dirname + '/client', [], {
      stdio: 'inherit',
      cwd: compPath,
      env: Object.assign({}, process.env, {
        PYTHONPATH: (process.env.PYTHONPATH || '') + ':/home/lyz122260/alibaba/pipcook/packages/costa/src/plugins/conda_envs/@pipcook/plugins-csv-data-collect@0.5.9/lib/python3.7/site-packages'
      })
    });
    this.handle.on('message', this.handleMessage.bind(this));
    this.handle.once('disconnect', this.afterDestroy.bind(this));
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
  start(): boolean {
    return this.send(PluginOperator.START);
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
