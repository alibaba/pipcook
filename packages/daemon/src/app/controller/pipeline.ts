
import { constants, PipelineDB } from '@pipcook/pipcook-core';
import { controller, inject, provide, post, get, put, del } from 'midway';
import Debug from 'debug';
import { PluginManager } from '../../service/plugin';
import { parseConfig } from '../../runner/helper';
import { BaseController } from './base-controller';
import { PipelineService } from '../../service/pipeline';
import { LogManager } from '../../service/log-manager';
import ServerSentEmitter from '../../utils/emitter';
const debug = Debug('daemon.app.pipeline');

@provide()
@controller('/pipeline')
export class PipelineController extends BaseController {
  @inject('pipelineService')
  pipelineService: PipelineService;

  @inject('pluginManager')
  pluginManager: PluginManager;

  @inject('logManager')
  logManager: LogManager;

  @post('')
  public async create() {
    try {
      const { name, isFile = true } = this.ctx.request.body;
      let { config } = this.ctx.request.body;
      if (!isFile && typeof config !== 'object') {
        config = JSON.parse(config);
      }
      const parsedConfig = await parseConfig(config);
      if (typeof name === 'string') {
        parsedConfig.name = name;
      }
      const pipeline = await this.pipelineService.createPipeline(parsedConfig);
      this.successRes(pipeline, 201);
    } catch (err) {
      this.failRes(err.message);
    }
  }

  @get('/list')
  public async list() {
    const { offset, limit } = this.ctx.query;
    try {
      const pipelines = await this.pipelineService.queryPipelines({ offset, limit });
      this.successRes(pipelines);
    } catch (err) {
      this.failRes(err.message);
    }
  }

  @del('')
  public async remove() {
    try {
      await this.pipelineService.removePipelines();
      this.successRes(undefined, 204);
    } catch (err) {
      this.failRes(err.message);
    }
  }

  @del('/:id')
  public async removeOne() {
    const { id } = this.ctx.params;
    try {
      const count = await this.pipelineService.removePipelineById(id);
      if (count > 0) {
        this.successRes(undefined, 204);
      } else {
        this.failRes('remove pipeline error, id not exists');
      }
    } catch (err) {
      this.failRes(err.message);
    }
  }

  @get('/info/:id')
  public async get() {
    const { id } = this.ctx.params;
    const json = { plugins: {} } as any;

    try {
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

      this.successRes(json);
    } catch (err) {
      this.failRes(err.message);
    }
  }

  @put('/:id')
  public async update() {
    const { ctx } = this;
    const { id } = ctx.params;
    try {
      const { isFile = true } = ctx.request.body;
      let { config } = ctx.request.body;
      if (!isFile && typeof config !== 'object') {
        config = JSON.parse(config);
      }
      const parsedConfig = await parseConfig(config, false);
      const data = await this.pipelineService.updatePipelineById(id, parsedConfig);
      this.successRes(data);
    } catch (err) {
      this.failRes(err.message);
    }
  }

  @get('/:id/install')
  public async installById() {
    const { pyIndex, cwd } = this.ctx.query;
    const pipeline = await this.pipelineService.getPipeline(this.ctx.params.id);
    return this.install(pipeline, pyIndex, cwd);
  }

  @get('/install')
  public async installByConfig() {
    const { config, pyIndex, cwd } = this.ctx.query;
    const pipeline = await parseConfig(config);
    return this.install(pipeline, pyIndex, cwd);
  }

  private async install(pipeline: PipelineDB, pyIndex?: string, cwd?: string) {
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
        const pkg = await this.pluginManager.fetch(pipeline[type], cwd);
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
