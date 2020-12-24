import {
  Filter,
  repository
} from '@loopback/repository';
import {
  api,
  post,
  param,
  get,
  getModelSchemaRef,
  del,
  requestBody,
  Response,
  oas,
  RestBindings
} from '@loopback/rest';
import { Job, JobParam, Pipeline } from '../models';
import { constants, PipelineStatus, PluginParamI } from '@pipcook/pipcook-core';
import { JobRepository } from '../repositories';
import { inject, service } from '@loopback/core';
import { JobService, PipelineService, TraceService } from '../services';
import { join } from 'path';
import { ensureDir, ensureFile, pathExists } from 'fs-extra';
import * as createError from 'http-errors';
import { CreateJobResp, JobCreateParameters } from './interface';

@api({ basePath: '/api/job' })
export class JobController {
  constructor(
    @repository(JobRepository)
    public jobRepository : JobRepository,
    @service(TraceService)
    public traceService: TraceService,
    @service(PipelineService)
    public pipelineService: PipelineService,
    @service(JobService)
    public jobService: JobService
  ) {
  }

  private async setupTracer(job: Job) {
    const logPath = join(constants.PIPCOOK_RUN, job.id, 'logs');
    const stdoutFile = join(logPath, 'stdout.log');
    const stderrFile = join(logPath, 'stderr.log');
    await ensureDir(logPath);
    await Promise.all([
      ensureFile(stdoutFile),
      ensureFile(stderrFile)
    ]);
    return this.traceService.create({ stdoutFile, stderrFile });
  }

  private initializeParams(pipeline: Pipeline, jobParams?: JobParam[]): JobParam[] {
    const params: JobParam[] = [];
    const jobParamsMap: {[key: string]: Record<string, unknown>} = {};

    jobParams?.forEach((it) => {
      jobParamsMap[it.pluginType] = it.data;
    });

    for (const pluginType of constants.PLUGINS) {
      const defaultParam = pipeline[`${pluginType}Params` as PluginParamI];
      const jobParam = jobParamsMap[pluginType] ? jobParamsMap[pluginType] : {};

      params.push({ pluginType, data: Object.assign(defaultParam, jobParam) });
    }
    return params;
  }

  /**
   * start a job from pipeline id or name
   */
  @post('/', {
    responses: {
      '200': {
        description: 'start a job from pipeline id or name',
        content: { 'application/json': { schema: getModelSchemaRef(Job) } }
      }
    }
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CreateJobResp)
        }
      }
    })
      param: JobCreateParameters,
  ): Promise<CreateJobResp> {
    const { pipelineId, params: updateParams = [] } = param;
    const pipeline = await this.pipelineService.getPipelineByIdOrName(pipelineId);
    if (pipeline) {
      const plugins = await this.pipelineService.fetchPlugins(pipeline);
      const params = this.initializeParams(pipeline, updateParams);
      const job = await this.jobService.createJob(pipelineId, params);
      const tracer = await this.setupTracer(job);

      process.nextTick(async () => {
        try {
          await this.jobService.runJob(job, pipeline, plugins, tracer);
          this.traceService.destroy(tracer.id);
        } catch (err) {
          this.traceService.destroy(tracer.id, err);
        }
      });
      const resp = {
        ... job,
        traceId: tracer.id
      } as CreateJobResp;
      return resp;
    } else {
      // TODO error handler
      throw new Error();
    }
  }

  /**
   * list jobs
   */
  @get('/', {
    responses: {
      '200': {
        description: 'Array of Job model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Job, { includeRelations: true })
            }
          }
        }
      }
    }
  })
  async list(
    @param.filter(Job) filter?: Filter<Job>
  ): Promise<Job[]> {
    return this.jobRepository.find(filter);
  }

  /**
   * remove all jobs
   */
  @del('/', {
    responses: {
      '204': {
        description: 'Job DELETE success'
      }
    }
  })
  async deleteAll(): Promise<void> {
    await this.jobRepository.deleteAll();
  }

  /**
   * remove job by id
   */
  @del('/{id}', {
    responses: {
      '204': {
        description: 'Job DELETE success'
      }
    }
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.jobService.removeJobById(id);
  }

  /**
   * cancel job
   */
  @post('/{id}/cancel', {
    responses: {
      '204': {
        description: 'Job CANCEL success'
      }
    }
  })
  async stop(@param.path.string('id') id: string): Promise<void> {
    await this.jobService.stopJob(id);
  }

  @get('/{id}/params', {
    responses: {
      '200': {
        description: 'GET job params',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              item: Object
            }
          }
        }
      }
    }
  })
  async getParams(@param.path.string('id') id: string): Promise<JobParam[]> {
    const job = await this.jobRepository.findById(id);
    return job.params ? job.params : [];
  }

  @get('/{id}/log', {
    responses: {
      '200': {
        description: 'GET log by id',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              item: String
            }
          }
        }
      }
    }
  })
  async viewLog(@param.path.string('id') id: string): Promise<string[]> {
    await this.jobRepository.findById(id);
    return this.jobService.getLogById(id);
  }

  @get('/{id}/output')
  @oas.response.file()
  async download(
    @param.path.string('id') id: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<Response> {
    const job = await this.jobRepository.findById(id);
    if (job.status !== PipelineStatus.SUCCESS) {
      throw new createError.BadRequest('invalid job status');
    }
    const outputPath = this.jobService.getOutputTarByJobId(id);
    if (!await pathExists(outputPath)) {
      throw new createError.BadRequest('output file not found');
    }
    response.download(outputPath, `pipcook-output-${id}.tar.gz`);

    return response;
  }

  @get('/{id}', {
    responses: {
      '200': {
        description: 'GET a job by id',
        content: {
          'application/json': getModelSchemaRef(Job)
        }
      }
    }
  })
  async get(@param.path.string('id') id: string): Promise<Job> {
    return this.jobRepository.findById(id);
  }
}
