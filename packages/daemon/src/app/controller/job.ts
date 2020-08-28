import { controller, inject, provide, get, post, del } from 'midway';
import * as HttpStatus from 'http-status';
import { constants } from '@pipcook/pipcook-core';
import { createReadStream, ensureDir, ensureFile } from 'fs-extra';
import { join } from 'path';
import { BaseEventController } from './base';
import { PipelineService } from '../../service/pipeline';
import { PluginManager } from '../../service/plugin';
import { JobResp } from '../../interface';

@provide()
@controller('/api/job')
export class JobController extends BaseEventController {

  @inject('pipelineService')
  pipelineService: PipelineService;

  @inject('pluginManager')
  pluginManager: PluginManager;

  /**
   * start a job from pipeline id or name
   */
  @post()
  public async run(): Promise<void> {
    const { pipelineId } = this.ctx.request.body;
    const pipeline = await this.pipelineService.getPipeline(pipelineId);
    if (pipeline) {
      const job = await this.pipelineService.createJob(pipelineId);
      const logPath = join(constants.PIPCOOK_RUN, job.id, 'logs');
      const stdoutFile = join(logPath, 'stdout.log');
      const stderrFile = join(logPath, 'stderr.log');
      await ensureDir(logPath);
      await [
        ensureFile(stdoutFile),
        ensureFile(stderrFile)
      ];
      const log = await this.traceManager.create({ stdoutFile, stderrFile });
      process.nextTick(async () => {
        try {
          await this.pipelineService.runJob(job, pipeline, log);
          this.traceManager.destroy(log.id);
        } catch (err) {
          this.traceManager.destroy(log.id, err);
        }
      });
      this.ctx.success({ ...(job.toJSON() as JobResp), traceId: log.id });
    } else {
      this.ctx.throw(HttpStatus.NOT_FOUND, 'not pipeline found');
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

  @get('/:id/log')
  public async viewLog(): Promise<void> {
    const { ctx } = this;
    const { id } = ctx.params;
    const data = await this.pipelineService.getLogById(id);
    if (data === null || data === undefined) {
      throw new Error('log not found');
    }
    this.ctx.success(data);
  }

  @get('/:id/output')
  public async download(): Promise<void> {
    const outputPath = this.pipelineService.getOutputTarByJobId(this.ctx.params.id);
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
