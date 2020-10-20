import { controller, inject, provide, get, post, del } from 'midway';
import * as HttpStatus from 'http-status';
import { constants, PipelineStatus } from '@pipcook/pipcook-core';
import { createReadStream, ensureDir, ensureFile, pathExists } from 'fs-extra';
import { join } from 'path';
import { BaseEventController } from './base';
import { PipelineService, JobEntity } from '../../service/pipeline';
import { PluginManager } from '../../service/plugin';

@provide()
@controller('/api/job')
export class JobController extends BaseEventController {

  @inject('pipelineService')
  pipelineService: PipelineService;

  @inject('pluginManager')
  pluginManager: PluginManager;

  /**
   * fetch pipeline by pipeline id prefix, return pipeline entity object
   * if zero or more than one pipeline found, throw error
   * @param prefix id prefix
   */
  async fetchJobByIdPrefix(prefix: string): Promise<JobEntity> {
    const jobs = await this.pipelineService.getJobsByPrefixId(prefix);
    if (jobs.length > 1) {
      return this.ctx.throw(HttpStatus.INTERNAL_SERVER_ERROR, `multiple jobs found with prefix: ${prefix}`);
    }
    if (jobs.length === 0) {
      return this.ctx.throw(HttpStatus.NOT_FOUND, 'job not found');
    }
    return jobs[0];
  }

  /**
   * start a job from pipeline id or name
   */
  @post()
  public async run(): Promise<void> {
    const { pipelineId } = this.ctx.request.body;
    const pipelines = await this.pipelineService.getPipelinesByPrefixId(pipelineId);
    if (pipelines.length > 1) {
      return this.ctx.throw(HttpStatus.INTERNAL_SERVER_ERROR, `multiple pipelines found with prefix: ${pipelineId}`);
    }
    if (pipelines.length === 0) {
      return this.ctx.throw(HttpStatus.NOT_FOUND, 'pipeline not found');
    }
    const pipeline = pipelines[0];
    const plugins = await this.pipelineService.fetchPlugins(pipeline);
    const job = await this.pipelineService.createJob(pipeline.id);
    const logPath = join(constants.PIPCOOK_RUN, job.id, 'logs');
    const stdoutFile = join(logPath, 'stdout.log');
    const stderrFile = join(logPath, 'stderr.log');
    await ensureDir(logPath);
    await [
      ensureFile(stdoutFile),
      ensureFile(stderrFile)
    ];
    const tracer = await this.traceManager.create({ stdoutFile, stderrFile });
    process.nextTick(async () => {
      try {
        await this.pipelineService.runJob(job, pipeline, plugins, tracer);
        this.traceManager.destroy(tracer.id);
      } catch (err) {
        this.traceManager.destroy(tracer.id, err);
      }
    });
    this.ctx.success({ ...job, traceId: tracer.id });
  }

  /**
   * list jobs
   */
  @get()
  public async list(): Promise<void> {
    const { pipelineId, offset, limit } = this.ctx.query;
    const jobs = await this.pipelineService.queryJobs({ pipelineId }, { offset, limit });
    this.ctx.success(jobs);
  }

  /**
   * remove all jobs
   */
  @del()
  public async removeAll(): Promise<void> {
    await this.pipelineService.removeJobs();
    this.ctx.success();
  }

  /**
   * remove job by id
   */
  @del('/:id')
  public async remove(): Promise<void> {
    const { id } = this.ctx.params;
    const job = await this.fetchJobByIdPrefix(id);
    await this.pipelineService.removeJobById(job.id);
    this.ctx.success();
  }

  /**
   * cancel job
   */
  @post('/:id/cancel')
  public async stop(): Promise<void> {
    const { id } = this.ctx.params;
    const job = await this.fetchJobByIdPrefix(id);
    await this.pipelineService.stopJob(job.id);
    this.ctx.success();
  }

  @get('/:id/log')
  public async viewLog(): Promise<void> {
    const { ctx } = this;
    const { id } = ctx.params;
    const job = await this.fetchJobByIdPrefix(id);
    const data = await this.pipelineService.getLogById(job.id);
    this.ctx.success(data);
  }

  @get('/:id/output')
  public async download(): Promise<void> {
    const job = await this.fetchJobByIdPrefix(this.ctx.params.id);
    if (job.status !== PipelineStatus.SUCCESS) {
      this.ctx.throw(HttpStatus.BAD_REQUEST, 'invalid job status');
    }
    const outputPath = this.pipelineService.getOutputTarByJobId(this.ctx.params.id);
    if (!await pathExists(outputPath)) {
      this.ctx.throw(HttpStatus.BAD_REQUEST, 'output file not found');
    }
    this.ctx.attachment(`pipcook-output-${this.ctx.params.id}.tar.gz`);
    this.ctx.body = createReadStream(outputPath);
  }

  @get('/:id')
  public async get(): Promise<void> {
    const { id } = this.ctx.params;
    this.ctx.success(await this.fetchJobByIdPrefix(id));
  }

  @get('/event/:traceId')
  public async traceEvent(): Promise<void> {
    await this.traceEventImpl();
  }
}
