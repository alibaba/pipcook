import { Context, controller, inject, provide, post } from 'midway';
import { getPluginRuntime } from '../../utils/plugin';
import { successRes } from '../../utils/response';

@provide()
@controller('/plugin')
export class PluginController {
  @inject()
  ctx: Context;

  @post('/install')
  public async install() {
    const { ctx } = this;
    const pluginRuntime = getPluginRuntime();
    // fetch information
    const metadata = await pluginRuntime.fetch(ctx.body.name);
    // install
    await pluginRuntime.install(metadata);
    successRes(ctx, {
      metadata
    });
  }

  @post('/uninstall')
  public async uninstall() {
    // TODO
    successRes(this.ctx, {});
  }
}
