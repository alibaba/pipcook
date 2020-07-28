import { Context, controller, inject, provide, get } from 'midway';
import { BaseController } from './base-controller';
import { PipelineService } from '../../service/pipeline';
import { parseConfig } from '../../runner/helper';
import ServerSentEmitter from '../../utils/emitter';
import { JobModel } from '../../model/job';
import { PluginManager } from '../../service/plugin';
import { createReadStream } from 'fs';

@provide()
@controller('/job')
export class JobController extends BaseController {
  @inject()
  ctx: Context;

  @inject('pipelineService')
  pipelineService: PipelineService;

  @inject('pluginManager')
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
        return this.failRes(err?.message);
      }
      this.successRes(job, 201);
    }
  }

  @get('/list')
  public async list() {
    const { pipelineId, offset, limit } = this.ctx.query;
    try {
      const jobs = await this.pipelineService.queryJobs({ pipelineId }, { offset, limit });
      this.successRes({
        data: jobs
      });
    } catch (err) {
      this.failRes(err.message);
    }
  }

  @get('/remove')
  public async remove() {
    const count = await this.pipelineService.removeJobs();
    this.successRes({
      message: 'remove jobs successfully',
      data: count
    });
  }

  @get('/stop')
  public async stop() {
    const { id } = this.ctx.query;
    const success = this.pipelineService.stopJob(id);
    if (success) {
      this.successRes(undefined);
    } else {
      this.failRes('stop job error');
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
      this.successRes({
        data: {
          log: data
        }
      });
    } catch (err) {
      this.failRes(err.message);
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
      this.successRes(job);
    } catch (err) {
      this.failRes(err.message);
    }
  }
}
