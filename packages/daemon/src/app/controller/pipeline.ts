
import { constants, PipelineDB } from '@pipcook/pipcook-core';
import { controller, inject, provide, post, get, put, del } from 'midway';
import * as Joi from 'joi';
import Debug from 'debug';
import * as createHttpError from 'http-errors';
import { PluginManager } from '../../service/plugin';
import { parseConfig } from '../../runner/helper';
import { BaseController } from './base';
import { PipelineService } from '../../service/pipeline';
import { LogManager } from '../../service/log-manager';
import ServerSentEmitter from '../../utils/emitter';
const debug = Debug('daemon.app.pipeline');

const createSchema = Joi.object({
  name: Joi.string(),
  config: Joi.object(),
  configFile: Joi.string(),
}).without('config', 'configFile').or('config', 'configFile');

const listSchema = Joi.object({
  offset: Joi.number(),
  limit: Joi.number()
});

@provide()
@controller('/pipeline')
export class PipelineController extends BaseController {
  @inject('pipelineService')
  pipelineService: PipelineService;

  @inject('pluginManager')
  pluginManager: PluginManager;

  @inject('logManager')
  logManager: LogManager;

  /**
   * create pipeline
   */
  @post()
  public async create() {
    this.validate(createSchema, this.ctx.request.body);
    const { name, configFile, config } = this.ctx.request.body;
    const parsedConfig = await parseConfig(configFile || config);
    parsedConfig.name = name;
    const pipeline = await this.pipelineService.createPipeline(parsedConfig);
    this.success(pipeline, 201);
  }

  /**
   * list pipelines
   */
  @get()
  public async list() {
    this.validate(listSchema, this.ctx.query);
    const { offset, limit } = this.ctx.query;
    const pipelines = await this.pipelineService.queryPipelines({ offset, limit });
    this.success(pipelines.rows);
  }

  /**
   * delete all pipelines
   */
  @del()
  public async remove() {
    await this.pipelineService.removePipelines();
    this.success();
  }

  /**
   * delete pipeline by id
   */
  @del('/:id')
  public async removeOne() {
    const { id } = this.ctx.params;
    const count = await this.pipelineService.removePipelineById(id);
    if (count > 0) {
      this.success();
    } else {
      throw createHttpError('remove pipeline error, id not exists', 404);
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
      throw new Error('pipeline not found');
    }
    const updatePluginNode = (name: string): void => {
      if (typeof pipeline[name] === 'string') {
        const params = pipeline[`${name}Params`];
        json.plugins[name] = {
          name: pipeline[name],
          params: params != null ? JSON.parse(params) : undefined
        };
      }
    };
    updatePluginNode('dataCollect');
    updatePluginNode('dataAccess');
    updatePluginNode('dataProcess');
    updatePluginNode('modelDefine');
    updatePluginNode('modelLoad');
    updatePluginNode('modelTrain');
    updatePluginNode('modelEvaluate');

    // update the `name` node
    if (pipeline.name) {
      json.name = pipeline.name;
    }

    this.success(json);
  }

  /**
   * update pipeline from config
   */
  @put('/:id')
  public async update() {
    const { ctx } = this;
    const { id } = ctx.params;
    const { isFile = true } = ctx.request.body;
    let { config } = ctx.request.body;
    if (!isFile && typeof config !== 'object') {
      config = JSON.parse(config);
    }
    const parsedConfig = await parseConfig(config, false);
    const data = await this.pipelineService.updatePipelineById(id, parsedConfig);
    this.success(data);
  }

  /**
   * start the installation process by id
   */
  @post('/:id/installation')
  public async installById() {
    const { pyIndex } = this.ctx.query;
    const pipeline = await this.pipelineService.getPipeline(this.ctx.params.id);
    if (pipeline) {
      process.nextTick(() => {
        this.install(pipeline, pyIndex);
      });
      this.success(pipeline);
    } else {
      throw createHttpError(404, 'no pipeline found');
    }
  }

  private async install(pipeline: PipelineDB, pyIndex?: string) {
    const sse = new ServerSentEmitter(this.ctx);
    const log = this.logManager.create();
    log.stderr.on('data', (data) => {
      sse.emit('log', { level: 'warn', data });
    });
    log.stdout.on('data', (data) => {
      sse.emit('log', { level: 'info', data });
    });
    log.stderr.on('error', (err) => {
      sse.emit('error', err.message);
    });
    try {
      for (const type of constants.PLUGINS) {
        if (!pipeline[type]) {
          continue;
        }
        debug(`start installation: ${type}`);
        const pkg = await this.pluginManager.fetch(pipeline[type]);
        sse.emit('info', pkg);

        debug(`installing ${pipeline[type]}.`);
        const plugin = await this.pluginManager.findOrCreateByPkg(pkg);
        try {
          await this.pluginManager.install(pkg, {
            pyIndex,
            force: false,
            stdout: log.stdout,
            stderr: log.stderr
          });
          sse.emit('installed', pkg);
        } catch (err) {
          this.pluginManager.removeById(plugin.id);
          throw err;
        }
      }
      sse.emit('finished', pipeline);
      this.logManager.destroy(log.id);
    } catch (err) {
      this.logManager.destroy(log.id, err);
    } finally {
      sse.finish();
    }
  }
}
