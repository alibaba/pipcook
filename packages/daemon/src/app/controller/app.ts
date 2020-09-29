import { controller, inject, provide, post } from 'midway';
import { BaseController } from './base';
import { AppService } from '../../service/app';

@provide()
@controller('/app')
export class AppController extends BaseController {
  @inject('appService')
  AppService: AppService;

  @post('/compile')
  public async compile() {
    const result = await this.AppService.compile(this.ctx.request.body.src as string);
    this.ctx.success({
      pipelines: result.pipelines,
      executableSource: result.executableSource
    });
  }
}
