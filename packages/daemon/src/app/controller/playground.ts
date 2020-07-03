import { Context, controller, inject, provide, get } from 'midway';
import axios from 'axios';

const RES_CDN_PREFIX = 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/pipcook/showcase';

@provide()
@controller('/playground')
export class PlayGroundController {
  @inject()
  ctx: Context;

  @get('/model/:model/:name')
  public async getModelManifest() {
    const { model, name } = this.ctx.params;
    const resp = await axios.get(`${RES_CDN_PREFIX}/${model}/${name}`, {
      responseType: 'stream'
    });
    this.ctx.body = resp.data;
  }
}
