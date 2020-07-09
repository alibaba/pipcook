import { Context, controller, inject, provide, get } from 'midway';
import { successRes, failRes } from '../../utils/response';
import { PipelineService } from '../../service/pipeline';
import { parseConfig } from '../../runner/helper';
import ServerSentEmitter from '../../utils/emitter';
import { JobModel } from '../../model/job';
import { PluginManager } from '../../service/plugin';
import { createReadStream } from 'fs';

@provide()
@controller('/job')
export class JobController {
  @inject()
  ctx: Context;

  @inject('pipelineService')
  pipelineService: PipelineService;

  @inject('PluginManager')
  pluginManager: PluginManager;

  @get('/run')
  public async run() {
    const { pipelineId, cwd, verbose, pyIndex } = this.ctx.request.query;
    const job = await this.pipelineService.createJob(pipelineId);
    await this.runJobWithContext(
      job,
      cwd,
      verbose === '1',
      pyIndex
    );
  }

  @get('/start')
  public async start() {
    const { config, cwd, verbose, pyIndex } = this.ctx.request.query;
    const parsedConfig = await parseConfig(config);
    const pipeline = await this.pipelineService.createPipeline(parsedConfig);
    const job = await this.pipelineService.createJob(pipeline.id);
    await this.runJobWithContext(
      job,
      cwd,
      verbose === '1',
      pyIndex
    );
  }

  private async runJobWithContext(job: JobModel, cwd: string, verbose: boolean, pyIndex: string) {
    if (verbose) {
      const sse = new ServerSentEmitter(this.ctx);
      try {
        const plugins = await this.pipelineService.installPlugins(job, cwd, pyIndex);
        sse.emit('job created', job);
        await this.pipelineService.startJob(job, cwd, plugins);
        // FIXME(yorkie): only pass the id because sse owns a max body length.
        sse.emit('job finished', { id: job.id });
      } catch (err) {
        sse.emit('error', err?.message);
      } finally {
        sse.finish();
      }
    } else {
      try {
        const plugins = await this.pipelineService.installPlugins(job, cwd, pyIndex);
        this.pipelineService.startJob(job, cwd, plugins);
      } catch (err) {
        return failRes(this.ctx, {
          message: err?.message,
          data: job
        });
      }
      successRes(this.ctx, {
        message: 'create pipeline and jobs successfully',
        data: job
      }, 201);
    }
  }

  @get('/list')
  public async list() {
    const { ctx } = this;
    const { pipelineId, offset, limit } = ctx.query;
    try {
      const jobs = await this.pipelineService.queryJobs({ pipelineId }, { offset, limit });
      successRes(ctx, {
        data: jobs
      });
    } catch (err) {
      failRes(ctx, {
        message: err.message
      });
    }
  }

  @get('/remove')
  public async remove() {
    const count = await this.pipelineService.removeJobs();
    successRes(this.ctx, {
      message: 'remove jobs successfully',
      data: count
    });
  }

  @get('/stop')
  public async stop() {
    const { id } = this.ctx.query;
    const success = this.pipelineService.stopJob(id);
    if (success) {
      successRes(this.ctx, {});
    } else {
      failRes(this.ctx, {message: 'stop job error'});
    }
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

  @get('/:id/output.tar.gz')
  public async output() {
    const outputPath = this.pipelineService.getOutputTarByJobId(this.ctx.params.id);
    this.ctx.body = createReadStream(outputPath);
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
