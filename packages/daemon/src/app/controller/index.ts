import { Context, controller, inject, provide, get } from 'midway';
import { readJSON } from 'fs-extra';
import { constants } from '@pipcook/pipcook-core';
import { join } from 'path';
import { successRes } from '../../utils/response';

@provide()
@controller('/')
export class IndexController {
  @inject()
  ctx: Context;

  @get('/')
  public async index() {
    this.ctx.redirect('/index.html');
  }

  @get('/versions')
  public async versions() {
    const daemonPkg = await readJSON(join(constants.PIPCOOK_DAEMON_SRC, 'package.json'));
    const pipboardPkg = await readJSON(join(constants.PIPCOOK_BOARD_SRC, 'package.json'));
    successRes(this.ctx, {
      data: {
        daemon: daemonPkg.version,
        pipboard: pipboardPkg.version
      },
    });
  }

  @get('/config')
  public async config() {
    const daemonConfig = await readJSON(constants.PIPCOOK_DAEMON_CONFIG);
    successRes(this.ctx, { data: daemonConfig });
  }
}
