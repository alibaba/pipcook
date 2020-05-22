import { Context, controller, inject, provide, post } from 'midway';
import { successRes } from '../../utils/response';
import PluginRuntime from '../../boot/plugin';

@provide()
@controller('/plugin')
export class PluginController {
  @inject()
  ctx: Context;

  @inject('pluginRT')
  pluginRT: PluginRuntime;

  @post('/install')
  public async install() {
    const { ctx } = this;
    const { costa } = this.pluginRT;

    // fetch information
    const metadata = await costa.fetch(ctx.request.body.name);
    // install
    await costa.install(metadata);
    successRes(ctx, { metadata });
  }

  @post('/uninstall')
  public async uninstall() {
    const { costa } = this.pluginRT;
    await costa.uninstall(this.ctx.request.body.name);
    successRes(this.ctx, {});
  }
}
