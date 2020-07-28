import { controller, inject, provide, post } from 'midway';
import { BaseController } from './base-controller';
import { AppService } from '../../service/app';

@provide()
@controller('/app')
export class AppController extends BaseController {
  @inject('AppService')
  AppService: AppService;

  @post('/compile')
  public async compile() {
    const result = await this.AppService.compile(this.ctx.request.body.src as string);
    this.successRes({
      pipelines: result.pipelines,
      executableSource: result.executableSource
    });
  }
}
