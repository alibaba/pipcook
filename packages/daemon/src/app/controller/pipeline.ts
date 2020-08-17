import { constants, PipelineDB, PluginStatus } from '@pipcook/pipcook-core';
import { controller, inject, provide, post, get, put, del } from 'midway';
import * as HttpStatus from 'http-status';
import * as Joi from 'joi';
import Debug from 'debug';
import { PluginManager } from '../../service/plugin';
import { parseConfig } from '../../runner/helper';
import { BaseEventController } from './base';
import { PipelineService } from '../../service/pipeline';
import { LogObject } from '../../service/log-manager';
import { PluginResp } from '../../interface';
const debug = Debug('daemon.app.pipeline');

const createSchema = Joi.object({
  name: Joi.string(),
  config: Joi.object(),
  configUri: Joi.string(),
}).without('config', 'configUri').or('config', 'configUri');

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
   * create pipeline
   */
  @post()
  public async create() {
    this.validate(createSchema, this.ctx.request.body);
    const { name, configUri, config } = this.ctx.request.body;
    const parsedConfig = await parseConfig(configUri || config);
    parsedConfig.name = name;
    const pipeline = await this.pipelineService.createPipeline(parsedConfig);
    this.ctx.success(pipeline, HttpStatus.CREATED);
  }

  /**
   * list pipelines
   */
  @get()
  public async list() {
    this.validate(listSchema, this.ctx.query);
    const { offset, limit } = this.ctx.query;
    const pipelines = await this.pipelineService.queryPipelines({ offset, limit });
    this.ctx.success(pipelines.rows);
  }

  /**
   * delete all pipelines
   */
  @del()
  public async remove() {
    await this.pipelineService.removePipelines();
    this.ctx.success();
  }

  /**
   * delete pipeline by id
   */
  @del('/:id')
  public async removeOne() {
    const { id } = this.ctx.params;
    const count = await this.pipelineService.removePipelineById(id);
    if (count > 0) {
      this.ctx.success();
    } else {
      this.ctx.throw(HttpStatus.NOT_FOUND, 'remove pipeline error, id not exists');
    }
  }

  /**
   * find a pipeline by id
   */
  @get('/:id')
  public async get() {
    const { id } = this.ctx.params;
    const json = { plugins: {} } as any;

    const pipeline = await this.pipelineService.getPipeline(id);
    if (!pipeline) {
      this.ctx.throw(HttpStatus.NOT_FOUND, 'pipeline not found');
    }
    constants.PLUGINS.forEach(name => {
      if (typeof pipeline[name] === 'string') {
        const params = pipeline[`${name}Params`];
        json.plugins[name] = {
          name: pipeline[name],
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
   * update pipeline from config
   */
  @put('/:id')
  public async update() {
    const { id } = this.ctx.params;
    this.validate(createSchema, this.ctx.request.body);
    const { config } = this.ctx.request.body;
    const parsedConfig = await parseConfig(config, false);
    const data = await this.pipelineService.updatePipelineById(id, parsedConfig);
    if (!data) {
      this.ctx.throw(HttpStatus.NOT_FOUND, 'no plugin found');
    }
    this.ctx.success(data);
  }

  /**
   * start the installation process by id
   */
  @post('/:id/installation')
  public async installById() {
    const { pyIndex } = this.ctx.request.body;
    const pipeline = await this.pipelineService.getPipeline(this.ctx.params.id);
    const log = await this.logManager.create();
    if (pipeline) {
      process.nextTick(async () => {
        try {
          await this.install(pipeline, log, pyIndex);
          this.logManager.destroy(log.id);
        } catch (err) {
          this.logManager.destroy(log.id, err);
        }
      });
      this.ctx.success({ ...(pipeline.toJSON() as PluginResp), traceId: log.id });
    } else {
      this.ctx.throw(HttpStatus.NOT_FOUND, 'no pipeline found');
    }
  }

  private async install(pipeline: PipelineDB, log: LogObject, pyIndex?: string): Promise<void> {
    for (const type of constants.PLUGINS) {
      if (!pipeline[type]) {
        continue;
      }
      let plugin = await this.pluginManager.findByName(pipeline[type]);
      if (plugin && plugin.status === PluginStatus.INSTALLED) {
        log.stdout.writeLine(`plugin ${plugin.name}@${plugin.version} already installed`);
        continue;
      }
      debug(`start installation: ${type}`);
      const pkg = await this.pluginManager.fetch(pipeline[type]);
      log.stdout.writeLine(`start to install plugin ${pkg.name}`);

      debug(`installing ${pipeline[type]}.`);
      plugin = await this.pluginManager.findOrCreateByPkg(pkg);
      try {
        await this.pluginManager.install(pkg, {
          pyIndex,
          force: false,
          stdout: log.stdout,
          stderr: log.stderr
        });
        this.pluginManager.setStatusById(plugin.id, PluginStatus.INSTALLED);
        log.stdout.writeLine(`install plugin ${pkg.name}@${pkg.version} successfully`);
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
