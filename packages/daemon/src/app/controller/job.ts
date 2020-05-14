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
    let data: any;
    try {
      data = await this.pipelineService.createNewRun(pipelineId);
      this.pipelineService.startRun(data);
      successRes(ctx, {
        message: 'create run job successfully',
        data
      }, 201);
    } catch (err) {
      if (data && data.id) {
        await this.pipelineService.updateRunById(data.id, {
          status: 3
        });
      }
      failRes(ctx, {
        message: err.message
      });
    }
  }

  @get('/:jobId/log')
  public async getLog() {
    const { ctx } = this;
    const { jobId } = ctx.params;
    try {
      const data = await this.pipelineService.getLogById(jobId);
      if (!data) {
        throw new Error('log not found');
      }
      successRes(ctx, {
        data: {
          log: data
        }
      });
    } catch (err) {
      failRes(ctx, {
        message: err.message
      });
    }
  }

  @get('/:jobId')
  public async getRunJob() {
    const { ctx } = this;
    const { jobId } = ctx.params;
    try {
      const data = await this.pipelineService.getRunById(jobId);
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
    try {
      let data: any;
      if (pipelineId) {
        data = await this.pipelineService.getRunsByPipelineId(pipelineId, offset, limit);
      } else {
        data = await this.pipelineService.getRuns(offset, limit);
      }
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
