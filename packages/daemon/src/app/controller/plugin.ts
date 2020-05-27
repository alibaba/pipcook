import { Context, controller, inject, provide, get } from 'midway';
import { successRes } from '../../utils/response';
import { PluginManager } from '../../service/plugin';
import ServerSentEmitter from '../../utils/emitter';
import Debug from 'debug';
const debug = Debug('daemon.app.plugin');

@provide()
@controller('/plugin')
export class PluginController {

  @inject()
  ctx: Context;

  @inject('PluginManager')
  pluginManager: PluginManager;

  @get('/install')
  public async install() {
    const name = this.ctx.query.name;
    const sse = new ServerSentEmitter(this.ctx);
    try {
      debug(`checking info: ${name}.`);
      const pkg = await this.pluginManager.fetch(name);
      sse.emit('info', pkg);

      debug(`installing ${name}.`);
      await this.pluginManager.install(pkg);
      sse.emit('installed', pkg);
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
