import { Context, controller, inject, provide, post, get } from 'midway';

import { successRes, failRes } from '../../utils/response';
import { PipelineService } from '../../service/pipeline';

@provide()
@controller('/job')
export class JobController {
  @inject()
  ctx: Context;

  @inject('pipelineService')
  pipelineService: PipelineService;

  @post('')
  public async runPipeline() {
    const { ctx } = this;
    const { pipelineId } = ctx.request.body;
    try {
      const data = await this.pipelineService.createNewRun(pipelineId);
      this.pipelineService.startRun(data);
      successRes(ctx, {
        message: 'create run job successfully',
        data
      }, 201);
    } catch (err) {
      failRes(ctx, {
        message: err.message
      });
    }
  }

  @get('/:runId')
  public async getRunJob() {
    const { ctx } = this;
    const { runId } = ctx.params;
    try {
      const data = await this.pipelineService.getRunById(runId);
      if (!data) {
        throw new Error('job not found');
      }
      successRes(ctx, {
        data
      });
    } catch (err) {
      failRes(ctx, {
        message: err.message
      });
    }
  }

  @get('')
  public async getRunJobs() {
    const { ctx } = this;
    const { pipelineId, offset = 0, limit = 10 } = ctx.query;
    console.log('0----', pipelineId);
    try {
      const data = await this.pipelineService.getRunsByPipelineId(pipelineId, offset, limit);
      if (!data || data.length === 0) {
        throw new Error('job not found');
      }
      successRes(ctx, {
        data
      });
    } catch (err) {
      failRes(ctx, {
        message: err.message
      });
    }
  }
}
