import { controller, inject, provide, get, post, del } from 'midway';
import * as HttpStatus from 'http-status';
import { constants, PipelineStatus } from '@pipcook/pipcook-core';
import { createReadStream, ensureDir, ensureFile, pathExists } from 'fs-extra';
import { join } from 'path';
import { BaseEventController } from './base';
import { PipelineService } from '../../service/pipeline';
import { PluginManager } from '../../service/plugin';
import { JobParam, JobEntity } from '../../model/job';
import { PipelineEntity } from '../../model/pipeline';

@provide()
@controller('/api/job')
export class JobController extends BaseEventController {

  @inject('pipelineService')
  pipelineService: PipelineService;

  @inject('pluginManager')
  pluginManager: PluginManager;

  private async setupTracer(job: JobEntity) {
    const logPath = join(constants.PIPCOOK_RUN, job.id, 'logs');
    const stdoutFile = join(logPath, 'stdout.log');
    const stderrFile = join(logPath, 'stderr.log');
    await ensureDir(logPath);
    await Promise.all([
      ensureFile(stdoutFile),
      ensureFile(stderrFile)
    ]);
    const tracer = await this.traceManager.create({ stdoutFile, stderrFile });
    return tracer;
  }

  private createParams(pipeline: PipelineEntity, jobParams?: JobParam[]): JobParam[] {
    const params: JobParam[] = [];

    for (const pluginType of constants.PLUGINS) {
      const tempParam = JSON.parse(pipeline[`${pluginType}Params`]);
      let jobParam = [];
      if (jobParams) {
        jobParam = jobParams.filter((it) => it.pluginType === pluginType)
                            .map((it) => it.data);
      }

      const temp: JobParam = {
        pluginType,
        data: Object.assign(tempParam, ...jobParam)
      };
      params.push(temp);
    }
    return params;
  }

  /**
   * start a job from pipeline id or name
   */
  @post()
  public async run(): Promise<void> {
    const { pipelineId } = this.ctx.request.body;
    const pipeline = await this.pipelineService.getPipeline(pipelineId);
    if (pipeline) {
      const plugins = await this.pipelineService.fetchPlugins(pipeline);
      const realParam = this.createParams(pipeline);
      const job = await this.pipelineService.createJob(pipelineId, realParam);

      const tracer = await this.setupTracer(job);

      process.nextTick(async () => {
        try {
          await this.pipelineService.runJob(job, pipeline, plugins, tracer);
          this.traceManager.destroy(tracer.id);
        } catch (err) {
          this.traceManager.destroy(tracer.id, err);
        }
      });
      this.ctx.success({ ...job, traceId: tracer.id });
    } else {
      this.ctx.throw(HttpStatus.NOT_FOUND, 'no pipeline found');
    }
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
    const count = await this.pipelineService.removeJobById(id);
    if (count) {
      this.ctx.success();
    } else {
      this.ctx.throw(HttpStatus.NOT_FOUND, 'no job found');
    }
  }

  /**
   * cancel job
   */
  @post('/:id/cancel')
  public async stop(): Promise<void> {
    const { id } = this.ctx.params;
    await this.pipelineService.stopJob(id);
    this.ctx.success();
  }

  @get('/:id/parameters')
  public async getParam(): Promise<void> {
    const { id } = this.ctx.params;
    const job = await this.pipelineService.getJobById(id);

    if (job) {
      this.ctx.success(job.params);
    } else {
      this.ctx.throw(HttpStatus.NOT_FOUND, 'no job found');
    }
  }

  /**
   * Run job with new param
   */
  @post('/:id/parameters')
  public async updateParam(): Promise<void> {
    const { id } = this.ctx.params;
    const { params } = this.ctx.request.body;

    const job = await this.pipelineService.getJobById(id);
    if (job) {
      const pipeline = await this.pipelineService.getPipeline(job.pipelineId);
      const realParam = this.createParams(pipeline, params);
      const plugins = await this.pipelineService.fetchPlugins(pipeline);
      const newJob = await this.pipelineService.createJob(pipeline.id, realParam);
      const tracer = await this.setupTracer(newJob);

      process.nextTick(async () => {
        try {
          await this.pipelineService.runJob(newJob, pipeline, plugins, tracer);
          this.traceManager.destroy(tracer.id);
        } catch (err) {
          this.traceManager.destroy(tracer.id, err);
        }
      });

      this.ctx.success({ ...newJob, traceId: tracer.id });
    } else {
      this.ctx.throw(HttpStatus.NOT_FOUND, 'no job found');
    }
  }

  @get('/:id/log')
  public async viewLog(): Promise<void> {
    const { ctx } = this;
    const { id } = ctx.params;
    if (!await this.pipelineService.getJobById(id)) {
      this.ctx.throw(HttpStatus.NOT_FOUND, 'job not found');
    }
    const data = await this.pipelineService.getLogById(id);
    this.ctx.success(data);
  }

  @get('/:id/output')
  public async download(): Promise<void> {
    const job = await this.pipelineService.getJobById(this.ctx.params.id);
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
    const job = await this.pipelineService.getJobById(id);
    if (!job) {
      this.ctx.throw(HttpStatus.NOT_FOUND, 'no job found');
    }
    this.ctx.success(job);
  }

  @get('/event/:traceId')
  public async traceEvent(): Promise<void> {
    await this.traceEventImpl();
  }
}
