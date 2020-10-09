import { controller, inject, provide, get, post, del, put } from 'midway';
import * as HttpStatus from 'http-status';
import { BaseEventController } from './base';
import { PluginManager } from '../../service/plugin';
import Debug from 'debug';
const debug = Debug('daemon.app.plugin');

@provide()
@controller('/api/plugin')
export class PluginController extends BaseEventController {

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
    this.ctx.success(response);
  }

  /**
   * reinstall plugin
   */
  @put()
  public async reinstall() {
    const { name, pyIndex } = this.ctx.request.body;
    debug(`checking info: ${name}.`);
    const response = await this.pluginManager.installByName(name, pyIndex, true);
    this.ctx.success(response);
  }

  /**
   * delete plugin by name
   */
  @del('/:id')
  public async remove() {
    const plugin = await this.pluginManager.findById(this.ctx.params.id);
    if (plugin) {
      await this.pluginManager.uninstall(plugin);
      this.ctx.success();
    } else {
      this.ctx.throw(HttpStatus.NOT_FOUND, `no plugin found by id ${this.ctx.params.id}`);
    }
  }

  /**
   * delete all plugins
   */
  @del()
  public async removeAll() {
    const plugins = await this.pluginManager.list();
    await this.pluginManager.uninstall(plugins);
    this.ctx.success();
  }

  /**
   * get metadata from name
   */
  @get('/metadata')
  public async getMetadata() {
    const name = this.ctx.query.name;
    if (!name) {
      return this.ctx.throw(HttpStatus.BAD_REQUEST, 'name is required');
    }
    const md = await this.pluginManager.fetch(name);
    this.ctx.success(md);
  }

  /**
   * find a plugin by id
   */
  @get('/:id')
  public async get() {
    const plugin = await this.pluginManager.findById(this.ctx.params.id);
    if (plugin) {
      this.ctx.success(plugin);
    } else {
      this.ctx.throw(HttpStatus.NOT_FOUND, 'no plugin found');
    }
  }

  /**
   * fetch the plugin metadata by a id
   */
  @get('/:id/metadata')
  public async getMetadataById() {
    const plugin = await this.pluginManager.findById(this.ctx.params.id);
    if (!plugin) {
      return this.ctx.throw(HttpStatus.NOT_FOUND, 'no plugin found');
    }
    const md = await this.pluginManager.fetch(`${plugin.name}@${plugin.version}`);
    this.ctx.success(md);
  }

  /**
   * list plugins
   */
  @get()
  public async list() {
    const plugins = await this.pluginManager.list({
      datatype: this.ctx.query.datatype,
      category: this.ctx.query.category,
      name: this.ctx.query.name
    });
    this.ctx.success(plugins);
  }

  /**
   * create a plugin by tarball stream
   */
  @post('/tarball')
  public async uploadPackage() {
    const fstream = await this.ctx.getFileStream();
    const { pyIndex } = fstream.fields;
    const installResp = await this.pluginManager.installFromTarStream(fstream, pyIndex, false);
    this.ctx.success(installResp);
  }

  /**
   * trace event
   */
  @get('/event/:traceId')
  public async event() {
    await this.traceEventImpl();
  }
}
