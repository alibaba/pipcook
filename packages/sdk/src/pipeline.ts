import { get, post, put, del } from './request';
import { PipelineResp, PipelineInstallOption, PipelineInstallingResp } from './interface';
import { BaseApi } from './base';
/**
 * API for pipeline
 */
export class Pipeline extends BaseApi {
  constructor(url: string) {
    super(`${url}/pipeline`);
  }

  /**
   * list all pipelines
   */
  list(): Promise<PipelineResp[]> {
    return get(`${this.route}`);
  }

  /**
   * get pipeline info by pipeline id
   * @param id pipeline id
   */
  async get(id: string): Promise<PipelineResp> {
    return await get(`${this.route}/${id}`);
  }
  info = this.get;
  /**
   * create a pipeline by pipeline config object
   * @param config pipeline config
   * @param opts name: pipeline name
   */
  async create(config: object, opts: any): Promise<PipelineResp> {
    return await post(`${this.route}`, {
      config,
      name: opts.name
    });
  }

  /**
   * create a pipeline by pipeline config uri
   * @param configUri pipeline config file uri
   * @param opts name: pipeline name
   */
  async createByUri(configUri: string, opts: any): Promise<PipelineResp> {
    return await post(`${this.route}`, {
      configUri,
      name: opts.name
    });
  }

  /**
   * update pipeline config
   * @param id pipeline id
   * @param config pipeline config
   */
  async update(id: string, config: PipelineResp): Promise<PipelineResp> {
    return await put(`${this.route}/${id}`, {
      config
    });
  }

  /**
   * remove pipeline by id, if the id is undefined or 'all', remove all
   * @param id pipline id or 'all'
   */
  async remove(id?: any): Promise<void> {
    if (typeof id === 'string' && id !== 'all') {
      return await del(`${this.route}/${id}`);
    } else {
      return await del(this.route);
    }
  }

  /**
   * install plugins defined in pipeline
   * @param id pipeline id
   * @param opt installation options
   */
  async install(id: string, opt?: PipelineInstallOption): Promise<PipelineInstallingResp> {
    return await post(`${this.route}/${id}/installation`, opt);
  }
}
