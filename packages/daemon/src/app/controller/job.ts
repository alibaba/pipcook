import { Context, controller, inject, provide, post, get } from 'midway';

import { successRes, failRes } from '../../utils/response';
import { PipelineService } from '../../service/pipeline';
import { parseConfig } from '../../runner/helper';
import { JobModel } from '../../model/job';

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
    let job: JobModel;
    try {
      console.log('create job with pipeline id', pipelineId);
      job = await this.pipelineService.createJob(pipelineId);
      this.pipelineService.startJob(job, process.cwd());
      successRes(ctx, {
        message: 'create run job successfully',
        job
      }, 201);
    } catch (err) {
      console.log(err?.stack);
      if (job && job.id) {
        await this.pipelineService.updateJobById(job.id, {
          status: 3
        });
      }
      failRes(ctx, {
        message: err.message
      });
    }
  }

  @post('/start')
  public async startPipeline() {
    const { ctx } = this;
    try {
      const { config, cwd } = ctx.request.body;
      const parsedConfig = await parseConfig(config);
      const data = await this.pipelineService.initPipeline(parsedConfig);
      const jobData = await this.pipelineService.createJob(data.id);
      this.pipelineService.startJob(jobData, cwd);
      successRes(ctx, {
        message: 'create pipeline and jobs successfully',
        data: jobData
      }, 201);
    } catch (err) {
      if (err.errors && err.errors[0] && err.errors[0].message) {
        err.message = err.errors[0].message;
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
      if (data === null || data === undefined) {
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
      const data = await this.pipelineService.getJobById(jobId);
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
        data = await this.pipelineService.getJobsByPipelineId(pipelineId, offset, limit);
      } else {
        data = await this.pipelineService.getJobs(offset, limit);
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
