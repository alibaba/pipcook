import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  api,
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
} from '@loopback/rest';
import { Job, JobParam, Pipeline } from '../models';
import { constants } from '@pipcook/pipcook-core';
import { JobRepository } from '../repositories';
import { service } from '@loopback/core';
import { TraceService } from '../services';
import { join } from 'path';
import { createReadStream, ensureDir, ensureFile, pathExists } from 'fs-extra';

@api({ basePath: '/api/jobs' })
export class JobController {
  constructor(
    @repository(JobRepository)
    public jobRepository : JobRepository,
    @service(TraceService)
    public traceService: TraceService
  ) {
    super(traceService);
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
    const tracer = await this.traceService.create({ stdoutFile, stderrFile });
    return tracer;
  }

  private initializeParams(pipeline: Pipeline, jobParams?: JobParam[]): JobParam[] {
    const params: JobParam[] = [];
    const jobParamsMap: {[key: string]: object} = {};

    jobParams?.forEach((it) => {
      jobParamsMap[it.pluginType] = it.data;
    });

    for (const pluginType of constants.PLUGINS) {
      // @ts-ignore
      const defaultParam = JSON.parse(pipeline[`${pluginType}Params`]);
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
        content: {'application/json': {schema: getModelSchemaRef(Job)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Job, {
            title: 'NewJob',
            exclude: ['id'],
          }),
        },
      },
    })
    job: Omit<Job, 'id'>,
  ): Promise<Job> {
    return this.jobRepository.create(job);
  }

  @get('/count', {
    responses: {
      '200': {
        description: 'Job model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.where(Job) where?: Where<Job>,
  ): Promise<Count> {
    return this.jobRepository.count(where);
  }

  @get('/', {
    responses: {
      '200': {
        description: 'Array of Job model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Job, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.filter(Job) filter?: Filter<Job>,
  ): Promise<Job[]> {
    return this.jobRepository.find(filter);
  }

  @patch('/', {
    responses: {
      '200': {
        description: 'Job PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Job, {partial: true}),
        },
      },
    })
    job: Job,
    @param.where(Job) where?: Where<Job>,
  ): Promise<Count> {
    return this.jobRepository.updateAll(job, where);
  }

  @get('/{id}', {
    responses: {
      '200': {
        description: 'Job model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Job, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Job, {exclude: 'where'}) filter?: FilterExcludingWhere<Job>
  ): Promise<Job> {
    return this.jobRepository.findById(id, filter);
  }

  @patch('/{id}', {
    responses: {
      '204': {
        description: 'Job PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Job, {partial: true}),
        },
      },
    })
    job: Job,
  ): Promise<void> {
    await this.jobRepository.updateById(id, job);
  }

  @put('/{id}', {
    responses: {
      '204': {
        description: 'Job PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() job: Job,
  ): Promise<void> {
    await this.jobRepository.replaceById(id, job);
  }

  @del('/{id}', {
    responses: {
      '204': {
        description: 'Job DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.jobRepository.deleteById(id);
  }
}
