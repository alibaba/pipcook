import { controller, inject, provide, get, post, del, put } from 'midway';
import { BaseController } from './base-controller';
import { PluginManager } from '../../service/plugin';
import ServerSentEmitter from '../../utils/emitter';
import { PluginInstallingResp } from '../../interface';
import Debug from 'debug';
const debug = Debug('daemon.app.plugin');

@provide()
@controller('/plugin')
export class PluginController extends BaseController {

  @inject('pluginManager')
  pluginManager: PluginManager;

  // TODO(feely): check if the plugin was installed
  @post()
  public async install() {
    const { name, pyIndex } = this.ctx.query;
    let response: PluginInstallingResp;
    debug(`checking info: ${name}.`);
    try {
      response = await this.pluginManager.installByName(name, pyIndex, false);
      this.successRes(response);
    } catch (err) {
      this.failRes(`plugin installation failed with error: ${err.message}`);
    }
  }

  /**
   * reinstall plugin
   */
  @put()
  public async reinstall() {
    const { name, pyIndex } = this.ctx.query;
    let response: PluginInstallingResp;
    debug(`checking info: ${name}.`);
    try {
      response = await this.pluginManager.installByName(name, pyIndex, true);
      this.successRes(response);
    } catch (err) {
      this.failRes(`plugin installation failed with error: ${err.message}`);
    }
  }

  /**
   * delete plugin by name
   */
  @del('/:name')
  public async delete() {
    try {
      if (typeof this.ctx.params.name === 'string' && this.ctx.params.name) {
        await this.pluginManager.uninstall(this.ctx.params.name);
        this.successRes(undefined, 204);
      } else {
        // not implemented
        this.failRes('no name value found', 400);
      }
    } catch (err) {
      this.failRes(err.message, 404);
    }
  }

  /**
   * find a plugin by id
   */
  @get('/:id')
  public async get() {
    const plugin = await this.pluginManager.findById(this.ctx.params.id);
    this.successRes(plugin);
  }

  /**
   * list plugins
   */
  @get()
  public async list() {
    const plugins = await this.pluginManager.list({
      datatype: this.ctx.query.datatype,
      category: this.ctx.query.category
    });
    this.successRes(plugins);
  }

  // create a plugin by tarball stream
  @post('/tarball')
  public async uploadPackage() {
    const fs = await this.ctx.getFileStream();
    const { pyIndex, force } = fs.fields;
    this.successRes(await this.pluginManager.installFromTarStream(fs, pyIndex, force));
  }

  private linkLog(logStream: NodeJS.ReadStream, level: 'info' | 'warn', sse: ServerSentEmitter): Promise<void> {
    return new Promise(resolve => {
      logStream.on('data', data => {
        sse.emit('log', { level, data });
      });
      logStream.on('close', resolve);
      logStream.on('error', err => {
        sse.emit('error', err.message);
      });
    });
  }

  /**
   * trace log
   */
  @get('/log/:id')
  public async log() {
    const sse = new ServerSentEmitter(this.ctx);
    const log = await this.pluginManager.getInstallLog(this.ctx.params.id);
    if (!log) {
      sse.emit('error', 'no log found');
      return sse.finish();
    }
    await Promise.all([
      this.linkLog(log.stdout, 'info', sse),
      this.linkLog(log.stderr, 'warn', sse)
    ]);
    return sse.finish();
  }
}
