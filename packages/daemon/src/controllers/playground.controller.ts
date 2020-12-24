import { api, get, param } from '@loopback/rest';

import axios from 'axios';

const RES_CDN_PREFIX = 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/pipcook/showcase';

@api({ basePath: '/api/playground' })
export class PlayGroundController {

  /**
   * find a model manifest by name
   */
  @get('/model/{model}/{name}', {
    responses: {
      '200': {
        description: 'find a model manifest by name',
        content: {
          'application/octet-stream': {
            'x-parser': 'stream',
            schema: { type: 'object' }
          }
        }
      }
    }
  })
  async getModelManifest(
    @param.path.string('model') model: string,
    @param.path.string('name') name: string
  ): Promise<Record<string, unknown>> {
    const resp = await axios.get(`${RES_CDN_PREFIX}/${model}/${name}`, {
      responseType: 'stream'
    });
    return resp.data;
  }
}
