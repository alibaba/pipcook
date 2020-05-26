import { Context, controller, inject, provide, get } from 'midway';
import { successRes } from '../../utils/response';
import { PluginManager } from '../../service/plugin';
import SseStream from 'ssestream';
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
    const sse = new SseStream(this.ctx.req);
    const res = this.ctx.res as NodeJS.WritableStream;
    sse.pipe(res);

    try {
      debug(`checking info: ${name}.`);
      const pkg = await this.pluginManager.fetch(name);
      sse.write({ event: 'info', data: pkg });

      debug(`installing ${name}.`);
      await this.pluginManager.install(pkg);
      sse.write({ event: 'installed', data: pkg });
    } catch (err) {
      sse.write({ event: 'error', data: err.message })
    } finally {
      sse.write({ event: 'session', data: 'close' });
      sse.unpipe(res);
    }
  }

  @get('/uninstall')
  public async uninstall() {
    await this.pluginManager.uninstall(this.ctx.query.name);
    successRes(this.ctx, {});
  }
}
