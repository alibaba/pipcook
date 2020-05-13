import { Context, controller, inject, provide, get } from 'midway';
import * as path from 'path';

import { MODULE_PATH } from '../../utils/tools';
import { successRes } from '../../utils/response';

@provide()
@controller('/boa')
export class BoaController {
  @inject()
  ctx: Context;

  @get('/bip')
  public async getBoaPath() {
    const { ctx } = this;
    successRes(ctx, {
      data: path.join(MODULE_PATH, '.bin', 'bip')
    });
  }
}
