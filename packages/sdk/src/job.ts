import { get, getFile, del, post, FileDownloadResp } from './request';
import { BaseApi } from './base';
import { JobResp, TraceResp } from './interface';

/**
 * API for job
 */
export class Job extends BaseApi {
  constructor(url: string) {
    super(`${url}/job`);
  }

  /**
   * list all jobs
   */
  list(): Promise<JobResp[]> {
    return get(this.route);
  }

  /**
   * remove pipeline by id, if the id is undefined remove all
   * @param id pipline id or undefined
   */
  remove(id?: string): Promise<void> {
    return del(`${this.route}/${id ? id : ''}`);
  }

  /**
   * get job info by job id
   * @param id job id
   */
  get(id: string): Promise<JobResp> {
    return get(`${this.route}/${id}`);
  }
  info = this.get;

  /**
   * cancel job by id
   * @param id job id
   */
  cancel(id: string): Promise<void> {
    return post(`${this.route}/${id}/cancel`);
  }

  /**
   * get job log
   * @param id job id
   */
  log(id: string): Promise<any> {
    return get(`${this.route}/${id}/log`);
  }

  /**
   * start to run a pipeline by pipeline id
   * @param piplineId pipeline id
   */
  run(pipelineId: string): Promise<TraceResp<JobResp>> {
    return post(`${this.route}`, { pipelineId });
  }

  // TODO(feely): browser not working
  /**
   * download model by job id
   * you should check the job status before downloading
   * @param id job id
   */
  downloadOutput(id: string): Promise<FileDownloadResp> {
    return getFile(`${this.route}/${id}/output`);
  }
}
