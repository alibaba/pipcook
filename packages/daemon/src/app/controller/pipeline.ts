import { Context, controller, inject, provide, post, get, del, put } from 'midway';
import { parseConfig } from '@pipcook/pipcook-core';

import { successRes, failRes } from '../../utils/response';
import { PipelineService } from '../../service/pipeline';

@provide()
@controller('/pipeline')
export class PipelineController {
  @inject()
  ctx: Context;

  @inject('pipelineService')
  pipelineService: PipelineService;

  @post('')
  public async createPipeline() {
    const { ctx } = this;
    try {
      const { config } = ctx.request.body;
      const parsedConfig = await parseConfig(config);
      const data = await this.pipelineService.initPipeline(parsedConfig);
      successRes(ctx, {
        message: 'create pipeline successfully',
        data
      }, 201);
    } catch (err) {
      failRes(ctx, {
        message: err.message
      });
    }
  }

  @get('')
  public async fetchPipelines() {
    const { ctx } = this;
    let { offset = 0, limit = 10 } = ctx.query;
    try {
      offset = parseInt(offset, 10);
      limit = parseInt(limit, 10);
      const data = await this.pipelineService.getPipelines(offset, limit);
      successRes(ctx, {
        message: 'get pipeline successfully',
        data
      });
    } catch (err) {
      failRes(ctx, {
        message: err.message
      });
    }
  }

  @get('/:pipelineId')
  public async fetchPipeline() {
    const { ctx } = this;
    const { pipelineId } = ctx.params;
    try {
      const data = await this.pipelineService.getPipelineById(pipelineId);
      if (!data) {
        throw new Error('pipeline not found');
      }
      successRes(ctx, {
        data
      });
    } catch (err) {
      failRes(ctx, {
        message: err.message
      });
    }
  }

  @del('/:pipelineId')
  public async deletePipeline() {
    const { ctx } = this;
    const { pipelineId } = ctx.params;
    try {
      await this.pipelineService.deletePipelineById(pipelineId);
      successRes(ctx, {
        message: 'Pipeline deleted successfully'
      });
    } catch (err) {
      failRes(ctx, {
        message: err.message
      });
    }
  }

  @put('/:pipelineId')
  public async updatePipeline() {
    const { ctx } = this;
    const { pipelineId } = ctx.params;
    try {
      const { config } = ctx.request.body;
      const parsedConfig = await parseConfig(config, false);
      const data = await this.pipelineService.updatePipelineById(pipelineId, parsedConfig);
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
}
