import { controller, inject, provide, get } from 'midway';

import { BaseController } from './base-controller';
import { PipelineService } from '../../service/pipeline';

@provide()
@controller('/log')
export class LogController extends BaseController {
  @inject('pipelineService')
  pipelineService: PipelineService;

  @get('/view/:id')
  public async view() {
    const { id } = this.ctx.params;
    const data = await this.pipelineService.getLogById(id);
    this.successRes(data);
  }
}
