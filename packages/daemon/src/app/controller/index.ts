import { Context, controller, inject, provide, get } from 'midway';
import { readJSON, pathExists } from 'fs-extra';
import { join } from 'path';
import { constants } from '@pipcook/pipcook-core';

@provide()
@controller('/')
export class IndexController {
  @inject()
  ctx: Context;

  @get('/')
  public async index() {
    this.ctx.redirect('/index.html');
  }

  @get('/api/versions')
  public async versions() {
    const daemonPkg = await readJSON(join(constants.PIPCOOK_DAEMON_SRC, 'package.json'));
    this.ctx.success({
      versions: {
        daemon: daemonPkg.version
      }
    });
  }

  @get('/api/config')
  public async config() {
    let data = {};
    if (await pathExists(constants.PIPCOOK_DAEMON_CONFIG)) {
      data = await readJSON(constants.PIPCOOK_DAEMON_CONFIG);
    }
    this.ctx.success(data);
  }
}
