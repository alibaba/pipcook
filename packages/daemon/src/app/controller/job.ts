import { Context, controller, inject, provide, get } from 'midway';
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

  @get('/run')
  public async run() {
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
  public async start() {
    const { ctx } = this;
    try {
      const { config, cwd, verbose } = ctx.request.query;
      const parsedConfig = await parseConfig(config);
      const pipeline = await this.pipelineService.createPipeline(parsedConfig);
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

  @get('/list')
  public async list() {
    const { ctx } = this;
    const { pipelineId, offset, limit } = ctx.query;
    try {
      const jobs = await this.pipelineService.queryJobs({ pipelineId }, { offset, limit });
      if (!jobs || jobs.count === 0) {
        throw new TypeError('job not found');
      }
      successRes(ctx, {
        data: jobs.rows
      });
    } catch (err) {
      failRes(ctx, {
        message: err.message
      });
    }
  }

  @get('/remove')
  public async remove() {
    await this.pipelineService.removeJobs();
    successRes(this.ctx, {});
  }

  @get('/:id/log')
  public async viewLog() {
    const { ctx } = this;
    const { id } = ctx.params;
    try {
      const data = await this.pipelineService.getLogById(id);
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

  @get('/:id')
  public async get() {
    const { id } = this.ctx.params;
    try {
      const job = await this.pipelineService.getJobById(id);
      if (!job) {
        throw new Error('job not found');
      }
      successRes(this.ctx, { data: job });
    } catch (err) {
      failRes(this.ctx, { message: err.message });
    }
  }
}
