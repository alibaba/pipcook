import { Context, controller, inject, provide, post, get, del } from 'midway';
import SseStream from 'ssestream';

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

  @get('/start')
  public async startPipeline() {
    const { ctx } = this;
    try {
      const { config, cwd, verbose } = ctx.request.query;
      const parsedConfig = await parseConfig(config);
      const pipeline = await this.pipelineService.initPipeline(parsedConfig);
      const job = await this.pipelineService.createJob(pipeline.id);

      if (verbose === '1') {
        const sse = new SseStream(this.ctx.req);
        const res = this.ctx.res as NodeJS.WritableStream;
        sse.pipe(res);
        sse.write({ event: 'job created', data: job });
        await this.pipelineService.startJob(job, cwd);
        sse.write({ event: 'job finished', data: job });
        sse.write({ event: 'session', data: 'close' });
        sse.unpipe(res);
      } else {
        this.pipelineService.startJob(job, cwd);
        successRes(ctx, {
          message: 'create pipeline and jobs successfully',
          data: job
        }, 201);
      }
    } catch (err) {
      if (err.errors && err.errors[0] && err.errors[0].message) {
        err.message = err.errors[0].message;
      }
      failRes(ctx, {
        message: err.message
      });
    }
  }

  @del('')
  public async deleteAll() {
    await this.pipelineService.deleteAllJobs();
    successRes(this.ctx, {});
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
