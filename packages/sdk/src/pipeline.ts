import { get, post, put, del } from './request';
import { PipelineResp, PipelineInstallOption, TraceResp, ListFilter, PipelineConfig } from './interface';
import { BaseApi, emitError } from './base';
/**
 * API for pipeline
 */
export class Pipeline extends BaseApi {
  constructor(url: string, onError?: (err: Error) => void) {
    super(`${url}/pipeline`, onError);
  }

  /**
   * list all pipelines
   * @param filter the filter option to list pipelines
   */
  @emitError()
  list(filter?: ListFilter): Promise<PipelineResp[]> {
    return get(`${this.route}`, filter);
  }

  /**
   * get pipeline info by pipeline id
   * @param id pipeline id
   */
  @emitError()
  get(id: string): Promise<PipelineResp> {
    return get(`${this.route}/${id}`);
  }
  info = this.get;

  /**
   * get pipeline config by pipeline id
   * @param id pipeline id
   */
  @emitError()
  getConfig(id: string): Promise<PipelineConfig> {
    return get(`${this.route}/${id}/config`);
  }

  /**
   * create a pipeline by pipeline config object
   * @param config pipeline config
   * @param opts name: pipeline name
   */
  @emitError()
  create(config: PipelineConfig, opts?: any): Promise<PipelineResp> {
    return post(`${this.route}`, {
      config,
      name: opts?.name
    });
  }

  /**
   * create a pipeline by pipeline config uri
   * @param configUri pipeline config file uri
   * @param opts name: pipeline name
   */
  @emitError()
  createByUri(configUri: string, opts?: any): Promise<PipelineResp> {
    return post(`${this.route}`, {
      configUri,
      name: opts?.name
    });
  }

  /**
   * update pipeline config
   * @param id pipeline id
   * @param config pipeline config
   */
  @emitError()
  update(id: string, config: PipelineConfig): Promise<PipelineResp> {
    return put(`${this.route}/${id}`, {
      config
    });
  }

  /**
   * remove pipeline by id, if the id is undefined, remove all
   * @param id pipline id or undefined
   */
  @emitError()
  remove(id?: string): Promise<void> {
    return del(`${this.route}/${id ? id : ''}`);
  }

  /**
   * install plugins defined in pipeline
   * @param id pipeline id
   * @param opt installation options
   */
  @emitError()
  install(id: string, opt?: PipelineInstallOption): Promise<TraceResp<PipelineResp>> {
    return post(`${this.route}/${id}/installation`, opt);
  }
}
