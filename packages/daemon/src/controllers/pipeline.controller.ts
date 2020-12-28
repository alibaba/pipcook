// Uncomment these imports to begin using these cool features!

// import {inject} from '@loopback/core';
import {
  repository
} from '@loopback/repository';
import { service } from '@loopback/core';
import {
  api,
  post,
  param,
  get,
  getModelSchemaRef,
  del,
  requestBody,
  put
} from '@loopback/rest';
import { constants, PluginTypeI, PluginStatus } from '@pipcook/pipcook-core';
import debug from 'debug';
import * as createError from 'http-errors';
import { Pipeline } from '../models';
import { JobRepository, PipelineRepository, PluginRepository } from '../repositories';
import {
  PluginService,
  PipelineService,
  JobService,
  TraceService,
  Tracer,
  PipelineTraceResp
} from '../services';
import { PipelineCreateParameters, PipelineUpdateParameters, PipelineInstallParameters, CreatePipelineResp } from './interface';
import { parseConfig } from '../utils';

const pipelineCreateSpec = {
  content: {
    'application/json': {
      schema: getModelSchemaRef(PipelineCreateParameters)
    }
  }
};

const pipelineUpdateSpec = {
  content: {
    'application/json': {
      schema: getModelSchemaRef(PipelineUpdateParameters)
    }
  }
};

const pipelineInstallationSpec = {
  content: {
    'application/json': {
      schema: getModelSchemaRef(PipelineInstallParameters)
    }
  }
};

@api({ basePath: '/api/pipeline' })
export class PipelineController {
  constructor(
    @repository(JobRepository)
    public jobRepository : JobRepository,

    @repository(PipelineRepository)
    public pipelineRepository : PipelineRepository,

    @repository(PluginRepository)
    public pluginRepository : PluginRepository,

    @service(PluginService)
    public pluginService: PluginService,

    @service(PipelineService)
    public pipelineService: PipelineService,

    @service(JobService)
    public jobService: JobService,

    @service(TraceService)
    public traceService: TraceService
  ) {}

  @post('/', {
    responses: {
      '201': {
        description: 'create pipeline',
        content: { 'application/json': { schema: getModelSchemaRef(CreatePipelineResp) } }
      }
    }
  })
  async create(
    @requestBody(pipelineCreateSpec) params: PipelineCreateParameters
  ): Promise<CreatePipelineResp> {
    const { name, configUri, config } = params;
    if (!(configUri || config)) {
      throw new createError.BadRequest('must provide configUri or config');
    }
    const parsedConfig = await parseConfig(configUri || config || '');
    parsedConfig.name = name;
    // the plugin name could be git/web url, we need the real name, and create plugin object
    const createPlugin = async (field: PluginTypeI) => {
      if (parsedConfig[field]) {
        let plugin = await this.pluginService.findByName(parsedConfig[field] as string);
        if (!plugin || plugin.status !== PluginStatus.INSTALLED) {
          const pkg = await this.pluginService.fetch(parsedConfig[field] as string);
          plugin = await this.pluginService.findOrCreateByPkg(pkg);
        }
        return plugin;
      }
    };
    const plugins = [];
    for (const pluginType of constants.PLUGINS) {
      const plugin = await createPlugin(pluginType);
      if (plugin) {
        parsedConfig[`${pluginType}Id` as PluginTypeI] = plugin.id;
        parsedConfig[pluginType] = plugin.name;
        plugins.push(plugin);
      }
    }
    const pipeline = await this.pipelineService.createPipeline(parsedConfig);
    const result: CreatePipelineResp = pipeline as CreatePipelineResp;
    result.plugins = plugins;
    return result;
  }

  @get('/', {
    responses: {
      '200': {
        description: 'list pipelines',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Pipeline, { includeRelations: true })
            }
          }
        }
      }
    }
  })
  async list(
    @param.query.string('offset') offset: string,
    @param.query.string('limit') limit: string,
  ): Promise<Pipeline[]> {
    const pipelines = await this.pipelineService.queryPipelines( parseInt(offset), parseInt(limit) );
    return pipelines;
  }

  @del('/', {
    responses: {
      '204': {
        description: 'All pipelines DELETE success'
      }
    }
  })
  async removeAll(): Promise<void> {
    const jobs = await this.jobRepository.find();
    await this.jobService.removeJobByEntities(jobs);
    await this.pipelineService.removeAllPipelines();
  }

  @del('/{id}', {
    responses: {
      '204': {
        description: 'Job DELETE success'
      }
    }
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    const jobs = await this.pipelineService.queryJobs({ pipelineId: id });
    await this.jobService.removeJobByEntities(jobs);
    await this.pipelineService.removePipelineById(id);
  }

  @get('/{id}/config', {
    responses: {
      '200': {
        description: 'GET Job Config'
      }
    }
  })
  async getConfig(@param.path.string('id') id: string): Promise<any> {
    const json = { plugins: {} } as any;
    const pipeline = await this.pipelineRepository.findById(id);
    constants.PLUGINS.forEach((name) => {
      if (typeof pipeline[name] === 'string') {
        const params = pipeline[`${name}Params` as PluginTypeI];
        json.plugins[name] = {
          package: pipeline[name],
          params
        };
      }
    });
    // update the `name` node
    if (pipeline.name) {
      json.name = pipeline.name;
    }
    return json;
  }

  @get('/{id}', {
    responses: {
      '200': {
        description: 'get pipeline by id',
        content: { 'application/json': { schema: getModelSchemaRef(CreatePipelineResp) } }
      }
    }
  })
  public async get(@param.path.string('id') id: string): Promise<CreatePipelineResp> {
    const pipeline = await this.pipelineRepository.findById(id);
    const pluginIds: string[] = [];
    constants.PLUGINS.forEach((pluginType) => {
      if (pipeline[`${pluginType}Id` as PluginTypeI]) {
        pluginIds.push(pipeline[`${pluginType}Id` as PluginTypeI] as string);
      }
    });
    const plugins = await this.pluginService.findByIds(pluginIds);
    const result = new CreatePipelineResp(pipeline.toJSON());
    result.plugins = plugins;
    return result;
  }

  @put('/{id}', {
    responses: {
      '204': {
        description: 'Pipeline Update Success'
      }
    }
  })
  public async update(
    @param.path.string('id') id: string,
    @requestBody(pipelineUpdateSpec) params: PipelineUpdateParameters
  ): Promise<void> {
    const { config } = params;
    const parsedConfig = await parseConfig(config, false);
    return this.pipelineRepository.updateById(id, parsedConfig);
  }

  @post('/{id}/installation')
  public async installById(
    @param.path.string('id') id: string,
    @requestBody(pipelineInstallationSpec) params: PipelineInstallParameters
  ): Promise<PipelineTraceResp> {
    const { pyIndex } = params;
    const pipeline = await this.pipelineRepository.findById(id);
    const log = await this.traceService.create();
    if (pipeline) {
      process.nextTick(async () => {
        try {
          await this.installByPipeline(pipeline, log, pyIndex);
          this.traceService.destroy(log.id);
        } catch (err) {
          this.traceService.destroy(log.id, err);
        }
      });
      return new PipelineTraceResp({ ...pipeline.toJSON(), traceId: log.id });
    } else {
      throw new createError.NotFound('no pipeline found');
    }
  }

  private async installByPipeline(pipeline: Pipeline, tracer: Tracer, pyIndex?: string): Promise<void> {
    const { stdout, stderr } = tracer.getLogger();
    for (const type of constants.PLUGINS) {
      if (!pipeline[type]) {
        continue;
      }
      let plugin = await this.pluginService.findByName(pipeline[type] as string);
      if (plugin && plugin.status === PluginStatus.INSTALLED) {
        stdout.writeLine(`plugin ${plugin.name}@${plugin.version} already installed`);
        continue;
      }
      debug(`start installation: ${type}`);
      const pkg = await this.pluginService.fetch(pipeline[type] as string);
      stdout.writeLine(`start to install plugin ${pkg.name}`);

      debug(`installing ${pipeline[type]}.`);
      plugin = await this.pluginService.findOrCreateByPkg(pkg);
      try {
        await this.pluginService.install(plugin.id, pkg, {
          pyIndex,
          force: false,
          stdout,
          stderr
        });
        this.pluginService.setStatusById(plugin.id, PluginStatus.INSTALLED);
        stdout.writeLine(`install plugin ${pkg.name}@${pkg.version} successfully`);
      } catch (err) {
        this.pluginService.setStatusById(plugin.id, PluginStatus.FAILED, err.message);
        throw err;
      }
    }
  }
}
