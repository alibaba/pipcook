import { controller, inject, provide, get, post, del, put } from 'midway';
import { BaseController } from './base';
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

  // TODO(feely): check if the plugin has been installed
  /**
   * create plugin and install it
   */
  @post()
  public async install() {
    const { name, pyIndex } = this.ctx.request.body;
    let response: PluginInstallingResp;
    debug(`checking info: ${name}.`);
    try {
      response = await this.pluginManager.installByName(name, pyIndex, false);
      this.success(response);
    } catch (err) {
      this.fail(`plugin installation failed with error: ${err.message}`);
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
      this.success(response);
    } catch (err) {
      this.fail(`plugin installation failed with error: ${err.message}`);
    }
  }

  /**
   * delete plugin by name
   */
  @del('/:id')
  public async remove() {
    try {
      if (typeof this.ctx.params.id === 'string' && this.ctx.params.id) {
        const plugin = await this.pluginManager.findById(this.ctx.params.id);
        if (plugin) {
          await this.pluginManager.uninstall(plugin);
          this.success(undefined, 204);
        } else {
          this.fail(`no plugin found by id ${this.ctx.params.id}`, 400);
        }
      } else {
        this.fail('no id value found', 400);
      }
    } catch (err) {
      this.fail(err.message, 404);
    }
  }
  /**
   * delete all plugins
   */
  @del()
  public async removeAll() {
    try {
      const plugins = await this.pluginManager.list();
      for (const plugin of plugins) {
        await this.pluginManager.uninstall(plugin);
      }
      this.success(undefined, 204);
    } catch (err) {
      this.fail(err.message, 404);
    }
  }
  /**
   * find a plugin by id
   */
  @get('/:id')
  public async get() {
    const plugin = await this.pluginManager.findById(this.ctx.params.id);
    if (plugin) {
      this.success(plugin);
    } else {
      this.fail('no plugin found', 404);
    }
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
    this.success(plugins);
  }

  /**
   * create a plugin by tarball stream
   */
  @post('/tarball')
  public async uploadPackage() {
    const fs = await this.ctx.getFileStream();
    const { pyIndex } = fs.fields;
    try {
      const installResp = await this.pluginManager.installFromTarStream(fs, pyIndex, false);
      this.success(installResp);
    } catch (err) {
      this.fail(`create plugin by tarball error: ${err.message}`);
    }
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
  @get('/log/:logId')
  public async log() {
    const sse = new ServerSentEmitter(this.ctx);
    const log = this.pluginManager.getInstallLog(this.ctx.params.logId);
    if (!log) {
      return sse.finish();
    }
    await Promise.all([
      this.linkLog(log.stdout, 'info', sse),
      this.linkLog(log.stderr, 'warn', sse)
    ]);
    return sse.finish();
  }
}
