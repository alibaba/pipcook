import { Context, controller, inject, provide, get } from 'midway';
import { BaseController } from './base';
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
    const { pipelineId, verbose, pyIndex } = this.ctx.request.query;
    const job = await this.pipelineService.createJob(pipelineId);
    await this.runJobWithContext(
      job,
      verbose === '1',
      pyIndex
    );
  }

  @get('/start')
  public async start() {
    const { config, verbose, pyIndex } = this.ctx.request.query;
    const parsedConfig = await parseConfig(config);
    const pipeline = await this.pipelineService.createPipeline(parsedConfig);
    const job = await this.pipelineService.createJob(pipeline.id);
    await this.runJobWithContext(
      job,
      verbose === '1',
      pyIndex
    );
  }

  private async runJobWithContext(job: JobModel, verbose: boolean, pyIndex: string) {
    if (verbose) {
      const sse = new ServerSentEmitter(this.ctx);
      try {
        const plugins = await this.pipelineService.installPlugins(job, pyIndex);
        sse.emit('job created', job);
        await this.pipelineService.startJob(job, plugins);
        // FIXME(yorkie): only pass the id because sse owns a max body length.
        sse.emit('job finished', { id: job.id });
      } catch (err) {
        sse.emit('error', err?.message);
      } finally {
        sse.finish();
      }
    } else {
      const plugins = await this.pipelineService.installPlugins(job, pyIndex);
      this.pipelineService.startJob(job, plugins);
      this.success(job, 201);
    }
  }

  @get('/list')
  public async list() {
    const { pipelineId, offset, limit } = this.ctx.query;
    const jobs = await this.pipelineService.queryJobs({ pipelineId }, { offset, limit });
    this.success({
      data: jobs
    });
  }

  @get('/remove')
  public async remove() {
    const count = await this.pipelineService.removeJobs();
    this.success({
      message: 'remove jobs successfully',
      data: count
    });
  }

  @get('/stop')
  public async stop() {
    const { id } = this.ctx.query;
    this.pipelineService.stopJob(id);
    this.success(undefined);
  }

  @get('/:id/log')
  public async viewLog() {
    const { ctx } = this;
    const { id } = ctx.params;
    const data = await this.pipelineService.getLogById(id);
    if (data === null || data === undefined) {
      throw new Error('log not found');
    }
    this.success(data);
  }

  @get('/:id/output.tar.gz')
  public async output() {
    const outputPath = this.pipelineService.getOutputTarByJobId(this.ctx.params.id);
    this.ctx.body = createReadStream(outputPath);
  }

  @get('/:id')
  public async get() {
    const { id } = this.ctx.params;
    const job = await this.pipelineService.getJobById(id);
    if (!job) {
      throw new Error('job not found');
    }
    this.success(job);
  }
}
