import { constants, PluginStatus } from '@pipcook/pipcook-core';
import { controller, inject, provide, post, get, put, del } from 'midway';
import * as HttpStatus from 'http-status';
import * as Joi from 'joi';
import Debug from 'debug';
import { PluginManager } from '../../service/plugin';
import { parseConfig } from '../../runner/helper';
import { BaseEventController } from './base';
import { PipelineService, PipelineEntity } from '../../service/pipeline';
import { Tracer } from '../../service/trace-manager';
const debug = Debug('daemon.app.pipeline');

const createSchema = Joi.object({
  name: Joi.string(),
  config: Joi.object(),
  configUri: Joi.string(),
}).xor('config', 'configUri');

const listSchema = Joi.object({
  offset: Joi.number().min(0),
  limit: Joi.number().min(1)
});

@provide()
@controller('/api/pipeline')
export class PipelineController extends BaseEventController {
  @inject('pipelineService')
  pipelineService: PipelineService;

  @inject('pluginManager')
  pluginManager: PluginManager;

  /**
   * fetch pipeline by pipeline id prefix, return pipeline entity object
   * if zero or more than one pipeline found, throw error
   * @param prefix id prefix
   */
  async fetchPipelineByIdPrefix(prefix: string): Promise<PipelineEntity> {
    const pipelines = await this.pipelineService.getPipelinesByPrefixId(prefix);
    if (pipelines.length > 1) {
      return this.ctx.throw(HttpStatus.INTERNAL_SERVER_ERROR, `multiple pipelines found with prefix: ${prefix}`);
    }
    if (pipelines.length === 0) {
      return this.ctx.throw(HttpStatus.NOT_FOUND, 'pipeline not found');
    }
    return pipelines[0];
  }

  /**
   * create pipeline
   */
  @post()
  public async create() {
    this.validate(createSchema, this.ctx.request.body);
    const { name, configUri, config } = this.ctx.request.body;
    const parsedConfig = await parseConfig(configUri || config);
    parsedConfig.name = name;
    // the plugin name could be git/web url, we need the real name, and create plugin object
    const createPlugin = async (field: string) => {
      if (parsedConfig[field]) {
        let plugin = await this.pluginManager.findByName(parsedConfig[field]);
        if (!plugin || plugin.status !== PluginStatus.INSTALLED) {
          const pkg = await this.pluginManager.fetch(parsedConfig[field]);
          plugin = await this.pluginManager.findOrCreateByPkg(pkg);
        }
        return plugin;
      }
    };
    const plugins = [];
    // TODO(Feely): modify to batch insert for performance
    for (const pluginType of constants.PLUGINS) {
      const plugin = await createPlugin(pluginType);
      if (plugin) {
        parsedConfig[`${pluginType}Id`] = plugin.id;
        parsedConfig[pluginType] = plugin.name;
        plugins.push(plugin);
      }
    }
    const pipeline = await this.pipelineService.createPipeline(parsedConfig);
    this.ctx.success({ ...pipeline, plugins }, HttpStatus.CREATED);
  }

  /**
   * list pipelines
   */
  @get()
  public async list() {
    this.validate(listSchema, this.ctx.query);
    const { offset, limit } = this.ctx.query;
    const pipelines = await this.pipelineService.queryPipelines({ offset, limit });
    this.ctx.success(pipelines);
  }

  /**
   * delete all pipelines
   */
  @del()
  public async remove() {
    const jobs = await this.pipelineService.queryJobs({});
    await this.pipelineService.removeJobByModels(jobs);
    await this.pipelineService.removePipelines();
    this.ctx.success();
  }

  /**
   * delete pipeline by id, it will remove the jobs which belong to the pipeline.
   */
  @del('/:id')
  public async removeOne() {
    const { id } = this.ctx.params;
    const pipeline = await this.fetchPipelineByIdPrefix(id);
    const jobs = await this.pipelineService.getJobsByPipelineId(pipeline.id);
    await this.pipelineService.removeJobByModels(jobs);
    await this.pipelineService.removePipelineById(pipeline.id);
    this.ctx.success();
  }

  /**
   * find a pipeline config by id
   */
  @get('/:id/config')
  public async getConfig() {
    const { id } = this.ctx.params;
    const json = { plugins: {} } as any;

    let pipeline;
    const pipelineFromName = await this.pipelineService.getPipelinesByName(id);
    if (pipelineFromName) {
      pipeline = pipelineFromName;
    } else {
      pipeline = await this.fetchPipelineByIdPrefix(id);
    }
    constants.PLUGINS.forEach(name => {
      if (typeof pipeline[name] === 'string') {
        const params = pipeline[`${name}Params`];
        json.plugins[name] = {
          package: pipeline[name],
          params: params != null ? JSON.parse(params) : undefined
        };
      }
    });
    // update the `name` node
    if (pipeline.name) {
      json.name = pipeline.name;
    }
    this.ctx.success(json);
  }

  /**
   * find a pipeline by id
   */
  @get('/:id')
  public async get() {
    const { id } = this.ctx.params;
    const pipeline = await this.fetchPipelineByIdPrefix(id);
    const pluginIds = [];
    constants.PLUGINS.forEach((pluginType) => {
      if (pipeline[`${pluginType}Id`]) {
        pluginIds.push(pipeline[`${pluginType}Id`]);
      }
    });
    const plugins = await this.pluginManager.findByIds(pluginIds);
    this.ctx.success({ ...pipeline, plugins });
  }

  /**
   * update pipeline from config
   */
  @put('/:id')
  public async update() {
    const { id } = this.ctx.params;
    this.validate(createSchema, this.ctx.request.body);
    const { config } = this.ctx.request.body;
    const parsedConfig = await parseConfig(config, false);
    const pipeline = await this.fetchPipelineByIdPrefix(id);
    const data = await this.pipelineService.updatePipelineById(pipeline.id, parsedConfig);
    this.ctx.success(data);
  }

  /**
   * start the installation process by id
   */
  @post('/:id/installation')
  public async installById() {
    const { pyIndex } = this.ctx.request.body;
    const pipeline = await this.fetchPipelineByIdPrefix(this.ctx.params.id);
    const log = await this.traceManager.create();
    process.nextTick(async () => {
      try {
        await this.installByPipeline(pipeline, log, pyIndex);
        this.traceManager.destroy(log.id);
      } catch (err) {
        this.traceManager.destroy(log.id, err);
      }
    });
    this.ctx.success({ ...pipeline, traceId: log.id });
  }

  private async installByPipeline(pipeline: PipelineEntity, tracer: Tracer, pyIndex?: string): Promise<void> {
    const { stdout, stderr } = tracer.getLogger();
    for (const type of constants.PLUGINS) {
      if (!pipeline[type]) {
        continue;
      }
      let plugin = await this.pluginManager.findByName(pipeline[type]);
      if (plugin && plugin.status === PluginStatus.INSTALLED) {
        stdout.writeLine(`plugin ${plugin.name}@${plugin.version} already installed`);
        continue;
      }
      debug(`start installation: ${type}`);
      const pkg = await this.pluginManager.fetch(pipeline[type]);
      stdout.writeLine(`start to install plugin ${pkg.name}`);

      debug(`installing ${pipeline[type]}.`);
      plugin = await this.pluginManager.findOrCreateByPkg(pkg);
      try {
        await this.pluginManager.install(plugin.id, pkg, {
          pyIndex,
          force: false,
          stdout,
          stderr
        });
        this.pluginManager.setStatusById(plugin.id, PluginStatus.INSTALLED);
        stdout.writeLine(`install plugin ${pkg.name}@${pkg.version} successfully`);
      } catch (err) {
        this.pluginManager.setStatusById(plugin.id, PluginStatus.FAILED, err.message);
        throw err;
      }
    }
  }

  /**
   * trace event
   */
  @get('/event/:traceId')
  public async traceEvent() {
    await this.traceEventImpl();
  }
}
