import { Context, controller, inject, provide, get } from 'midway';

import { successRes, failRes } from '../../utils/response';
import { PipelineService } from '../../service/pipeline';

@provide()
@controller('/log')
export class LogController {
  @inject()
  ctx: Context;

  @inject('pipelineService')
  pipelineService: PipelineService;

  @get('/logs')
  public async getLogs() {
    const { ctx } = this;
    let { offset = 0, limit = 50 } = ctx.query;
    try {
      offset = parseInt(offset, 10);
      limit = parseInt(limit, 10);
      const data = await this.pipelineService.getJobs(offset, limit);
      successRes(ctx, {
        message: 'get logs successfully',
        data
      });
    } catch (err) {
      failRes(ctx, {
        message: err.message
      });
    }
  }

  @get('/pipelines')
  public async getPipelines() {
    const { ctx } = this;
    let { offset = 0, limit = 50 } = ctx.query;
    try {
      offset = parseInt(offset, 10);
      limit = parseInt(limit, 10);
      const data = await this.pipelineService.getPipelines(offset, limit);
      successRes(ctx, {
        message: 'get pipelines successfully',
        data
      });
    } catch (err) {
      failRes(ctx, {
        message: err.message
      });
    }
  }
}
