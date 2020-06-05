import { Context, controller, inject, provide, get } from 'midway';
import { successRes } from '../../utils/response';
import { PluginManager } from '../../service/plugin';
import ServerSentEmitter from '../../utils/emitter';
import { parseConfig } from '../../runner/helper';
import Debug from 'debug';
const debug = Debug('daemon.app.plugin');
import { constants } from '@pipcook/pipcook-core';

@provide()
@controller('/plugin')
export class PluginController {

  @inject()
  ctx: Context;

  @inject('PluginManager')
  pluginManager: PluginManager;

  @get('/install')
  public async install() {
    const { name, pyIndex } = this.ctx.query;
    const sse = new ServerSentEmitter(this.ctx);
    try {
      debug(`checking info: ${name}.`);
      const pkg = await this.pluginManager.fetch(name);
      sse.emit('info', pkg);

      debug(`installing ${name}.`);
      await this.pluginManager.install(pkg, pyIndex);
      sse.emit('installed', pkg);
    } catch (err) {
      sse.emit('error', err?.message);
    } finally {
      sse.finish();
    }
  }

  @get('/installFromConfig')
  public async installFromConfig() {
    const { config, pyIndex } = this.ctx.query;
    const configObj = await parseConfig(config);
    console.log(config, configObj);
    const sse = new ServerSentEmitter(this.ctx);
    try {
      for (const i in constants.PLUGINS) {
        const plugin = constants.PLUGINS[i];
        if (!configObj[plugin]) {
          continue;
        }
        console.log(`constants.PLUGINS.forEach ${plugin} ${configObj[plugin]}`);
        debug(`start installation: ${plugin}`);
        const pkg = await this.pluginManager.fetch(configObj[plugin]);
        sse.emit('info', pkg);

        debug(`installing ${configObj[plugin]}.`);
        await this.pluginManager.install(pkg, pyIndex);
        sse.emit('installed', pkg);
      }
      sse.emit('finished', configObj);
    } catch (err) {
      sse.emit('error', err?.message);
    } finally {
      sse.finish();
    }
  }

  @get('/uninstall')
  public async uninstall() {
    await this.pluginManager.uninstall(this.ctx.query.name);
    successRes(this.ctx, {});
  }

  @get('/list')
  public async list() {
    const plugins = await this.pluginManager.list({
      datatype: this.ctx.query.datatype,
      category: this.ctx.query.category
    });
    successRes(this.ctx, { data: plugins });
  }
}
