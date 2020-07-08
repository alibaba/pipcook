import { get, post, put, del, listen } from './request';
import { tunaMirrorURI } from './utils';

/**
 * API for pipeline
 */
export class Pipeline {
  route: string;
  constructor(host: string, port: number) {
    this.route = `${host}:${port}/pipeline`;
  }

  /**
   * list all pipelines
   */
  async list(): Promise<any[]> {
    return (await get(`${this.route}/list`)).rows;
  }

  /**
   * get pipeline info by pipeline id
   * @param id pipeline id
   */
  async info(id: string): Promise<any> {
    return await get(`${this.route}/info/${id}`);
  }

  /**
   * create a pipeline by pipeline file
   * @param config pipeline config
   * @param opts name: pipeline name
   */
  async create(config: object, opts: any): Promise<any> {
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
  async update(id: string, config: object): Promise<any> {
    return await put(`${this.route}/${id}`, {
      config,
      isFile: false
    });
  }

  /**
   * remove pipeline by id, if id is undefined or 'all', remove all
   * @param id pipline id or 'all'
   */
  async remove(id?: any): Promise<number> {
    if (typeof id === 'string' && id !== 'all') {
      return await del(`${this.route}/${id}`);
    } else {
      return await del(this.route);
    }
  }

  /**
   * install plugins defined in pipeline
   * @param id pipeline id
   * @param opt tuna: is using tuna mirror
   */
  async install(id: string, opt?: any): Promise<void> {
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
