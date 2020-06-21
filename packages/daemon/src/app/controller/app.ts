import { Context, controller, inject, provide, post } from 'midway';
import { AppService } from '../../service/app';
import { successRes } from '../../utils/response';

@provide()
@controller('/app')
export class AppController {
  @inject()
  ctx: Context;

  @inject('AppService')
  AppService: AppService;

  @post('/compile')
  public async compile() {
    const result = await this.AppService.compile(this.ctx.request.body.src as string);
    successRes(this.ctx, {
      data: {
        pipelines: result.pipelines,
        executableSource: result.executableSource
      }
    });
  }
}
