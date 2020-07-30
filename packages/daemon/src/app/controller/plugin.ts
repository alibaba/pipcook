import { controller, inject, provide, get, post, del, put } from 'midway';
import * as HttpStatus from 'http-status';
import { BaseLogController } from './base';
import { PluginManager } from '../../service/plugin';
import Debug from 'debug';
const debug = Debug('daemon.app.plugin');

@provide()
@controller('/plugin')
export class PluginController extends BaseLogController {

  @inject('pluginManager')
  pluginManager: PluginManager;

  // TODO(feely): check if the plugin has been installed
  /**
   * create plugin and install it
   */
  @post()
  public async install() {
    const { name, pyIndex } = this.ctx.request.body;
    debug(`checking info: ${name}.`);
    const response = await this.pluginManager.installByName(name, pyIndex, false);
    this.success(response);
  }

  /**
   * reinstall plugin
   */
  @put()
  public async reinstall() {
    const { name, pyIndex } = this.ctx.query;
    debug(`checking info: ${name}.`);
    const response = await this.pluginManager.installByName(name, pyIndex, true);
    this.success(response);
  }

  /**
   * delete plugin by name
   */
  @del('/:id')
  public async remove() {
    if (typeof this.ctx.params.id === 'string' && this.ctx.params.id) {
      const plugin = await this.pluginManager.findById(this.ctx.params.id);
      if (plugin) {
        await this.pluginManager.uninstall(plugin);
        this.success();
      } else {
        this.ctx.throw(`no plugin found by id ${this.ctx.params.id}`, HttpStatus.NOT_FOUND);
      }
    } else {
      this.ctx.throw('no id value found', HttpStatus.BAD_REQUEST);
    }
  }
  /**
   * delete all plugins
   */
  @del()
  public async removeAll() {
    const plugins = await this.pluginManager.list();
    for (const plugin of plugins) {
      await this.pluginManager.uninstall(plugin);
    }
    this.success();
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
      this.ctx.throw('no plugin found', HttpStatus.NOT_FOUND);
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
    const fstream = await this.ctx.getFileStream();
    const { pyIndex } = fstream.fields;
    const installResp = await this.pluginManager.installFromTarStream(fstream, pyIndex, false);
    this.success(installResp);
  }

  /**
   * trace log
   */
  @get('/log/:logId')
  public async log() {
    await this.logImpl();
  }
}
