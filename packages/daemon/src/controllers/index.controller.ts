import { api, get } from '@loopback/rest';
import { constants } from '@pipcook/pipcook-core';
import { readJSON } from 'fs-extra';
import { join } from 'path';

@api({ basePath: '/api' })
export class IndexController {

  /**
   * list versions
   */
  @get('/versions', {
    responses: {
      '200': {
        description: 'list versions',
        content: {
          'application/json': {
            schema: { type: 'object' }
          }
        }
      }
    }
  })
  async versions(): Promise<{ versions: Record<string, unknown> }> {
    const daemonPkg = await readJSON(join(constants.PIPCOOK_DAEMON_SRC, 'package.json'));
    return {
      versions: {
        daemon: daemonPkg.version
      }
    };
  }

  /**
   * get daemon config
   */
  @get('/config', {
    responses: {
      '200': {
        description: 'get daemon config',
        content: {
          'application/json': {
            schema: { type: 'object' }
          }
        }
      }
    }
  })
  async config(): Promise<Record<string, unknown>> {
    let data = {};
    try {
      return await readJSON(constants.PIPCOOK_DAEMON_CONFIG);
    } catch (err) {
      console.warn('read config error', err.message);
      return data;
    }
  }
}
