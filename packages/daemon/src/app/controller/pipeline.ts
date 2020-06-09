
import { constants } from '@pipcook/pipcook-core';
import { Context, controller, inject, provide, post, get, put, del } from 'midway';
import Debug from 'debug';
import { PluginManager } from '../../service/plugin';
import { parseConfig } from '../../runner/helper';
import { successRes, failRes } from '../../utils/response';
import { PipelineService } from '../../service/pipeline';
import ServerSentEmitter from '../../utils/emitter';
const debug = Debug('daemon.app.pipeline');

@provide()
@controller('/pipeline')
export class PipelineController {
  @inject()
  ctx: Context;

  @inject('pipelineService')
  pipelineService: PipelineService;

  @inject('PluginManager')
  pluginManager: PluginManager;

  @post('')
  public async create() {
    const { ctx } = this;
    try {
      const { name, isFile = true } = ctx.request.body;
      let { config } = ctx.request.body;
      if (!isFile) {
        config = JSON.parse(config);
      }
      const parsedConfig = await parseConfig(config);
      if (typeof name === 'string') {
        parsedConfig.name = name;
      }
      const pipeline = await this.pipelineService.createPipeline(parsedConfig);
      successRes(ctx, {
        message: 'create pipeline successfully',
        data: pipeline
      }, 201);
    } catch (err) {
      failRes(ctx, {
        message: err.message
      });
    }
  }

  @get('/list')
  public async list() {
    const { offset, limit } = this.ctx.query;
    try {
      const pipelines = await this.pipelineService.queryPipelines({ offset, limit });
      successRes(this.ctx, {
        message: 'get pipeline successfully',
        data: pipelines,
      });
    } catch (err) {
      failRes(this.ctx, {
        message: err.message
      });
    }
  }

  @del('')
  public async remove() {
    try {
      const count = await this.pipelineService.removePipelines();
      successRes(this.ctx, {
        message: 'get pipeline successfully',
        data: count
      });
    } catch (err) {
      failRes(this.ctx, {
        message: err.message
      });
    }
  }

  @del('/:id')
  public async removeOne() {
    const { id } = this.ctx.params;
    try {
      const count = await this.pipelineService.removePipelineById(id);
      successRes(this.ctx, {
        message: 'get pipeline successfully',
        data: count
      });
    } catch (err) {
      failRes(this.ctx, {
        message: err.message
      });
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

      successRes(this.ctx, {
        data: json
      });
    } catch (err) {
      failRes(this.ctx, {
        message: err.message
      });
    }
  }

  @put('/:id')
  public async update() {
    const { ctx } = this;
    const { id } = ctx.params;
    try {
      const { isFile = true } = ctx.request.body;
      let { config } = ctx.request.body;
      if (!isFile) {
        config = JSON.parse(config);
      }
      const parsedConfig = await parseConfig(config, false);
      const data = await this.pipelineService.updatePipelineById(id, parsedConfig);
      successRes(ctx, {
        message: 'update pipeline successfully',
        data
      });
    } catch (err) {
      failRes(ctx, {
        message: err.message
      });
    }
  }

  @get('/install')
  public async install() {
    const { config, pyIndex, cwd  } = this.ctx.query;
    const configObj = await parseConfig(config);
    const sse = new ServerSentEmitter(this.ctx);
    try {
      for (const type of constants.PLUGINS) {
        if (!configObj[type]) {
          continue;
        }
        debug(`start installation: ${type}`);
        const pkg = await this.pluginManager.fetch(configObj[type], cwd);
        sse.emit('info', pkg);

        debug(`installing ${configObj[type]}.`);
        await this.pluginManager.install(pkg, pyIndex);
        sse.emit('installed', pkg);
      }
      sse.emit('finished', configObj);
    } catch (err) {
      sse.emit('error', err?.message);
    } finally {
      sse.finish();
    }
  }
}
