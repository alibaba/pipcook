import { Controller } from 'egg';
import { PipcookRunner } from '@pipcook/pipcook-core';
import { fork } from 'child_process';
import * as fs from 'fs-extra';

import { successRes, failRes } from '../utils';

export default class PipelineController extends Controller {
  public async create() {
    const { ctx } = this;
    const { config } = ctx.request.body;

    if (!(config)) {
      return failRes(ctx, {
        message: 'Please specify the config path';
      });
    }
    const pathExist = await fs.pathExists(config);
    if (!pathExist) {
      return failRes(ctx, {
        message: 'The path does not exist';
      });
    }
  
    const runner = new PipcookRunner();
    runner.runConfig(config);

    return ctx.body;
  }
}
