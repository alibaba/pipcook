import { get, post, put, del, listen } from './request';
import { tunaMirrorURI } from './utils';
import { PipelineModel, PipelineInstallOption } from './interface';

/**
 * API for pipeline
 */
export class Pipeline {
  route: string;
  constructor(url: string) {
    this.route = `${url}/pipeline`;
  }

  /**
   * list all pipelines
   */
  async list(): Promise<PipelineModel[]> {
    return (await get(`${this.route}/list`)).rows;
  }

  /**
   * get pipeline info by pipeline id
   * @param id pipeline id
   */
  async info(id: string): Promise<PipelineModel> {
    return await get(`${this.route}/info/${id}`);
  }

  /**
   * create a pipeline by pipeline config object
   * @param config pipeline config
   * @param opts name: pipeline name
   */
  async create(config: object, opts: any): Promise<PipelineModel> {
    return await post(`${this.route}`, {
      config,
      name: opts.name,
      isFile: false
    });
  }

  /**
   * update pipeline config
   * @param id pipeline id
   * @param config pipeline config
   */
  async update(id: string, config: object): Promise<PipelineModel> {
    return await put(`${this.route}/${id}`, {
      config,
      isFile: false
    });
  }

  /**
   * remove pipeline by id, if the id is undefined or 'all', remove all
   * @param id pipline id or 'all'
   */
  async remove(id?: any): Promise<number> {
    if (typeof id === 'string' && id !== 'all') {
      return await del(`${this.route}/${id}`);
    } else {
      return await del(this.route);
    }
  }

  // TODO(feely): offer event notification about install progress.
  /**
   * install plugins defined in pipeline
   * @param id pipeline id
   * @param opt tuna: is using tuna mirror
   */
  async installPlugins(id: string, opt?: PipelineInstallOption): Promise<void> {
    return new Promise((resolve, reject) => {
      listen(`${this.route}/${id}/install`, { pyIndex: opt?.tuna ? tunaMirrorURI : undefined }, {
        'error': (e: MessageEvent) => {
          reject(new TypeError(e.data));
        },
        'finished': () => {
          resolve();
        }
      });
    });
  }
}
