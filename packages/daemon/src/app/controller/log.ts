import { Context, controller, inject, provide, get } from 'midway';

import { successRes } from '../../utils/response';
import { PipelineService } from '../../service/pipeline';

@provide()
@controller('/log')
export class LogController {
  @inject()
  ctx: Context;

  @inject('pipelineService')
  pipelineService: PipelineService;

  @get('/view/:id')
  public async view() {
    const { id } = this.ctx.params;
    const data = await this.pipelineService.getLogById(id);
    successRes(this.ctx, { data });
  }
}
