import { get, getFile, del, post, FileDownloadResp } from './request';
import { BaseApi, errorHandle } from './base';
import { JobResp, TraceResp, JobListFilter, InitOption } from './interface';

/**
 * Job API object.
 */
export class Job extends BaseApi {
  /**
   * Use PipcookClient instead.
   * @private
   */
  constructor(url: string, opts?: InitOption) {
    super(`${url}/job`, opts);
  }

  /**
   * list all jobs.
   * @param filter the filter to list the jobs.
   * @returns The jobs list.
   */
  @errorHandle()
  list(filter?: JobListFilter): Promise<JobResp[]> {
    return get(this.route, filter);
  }

  /**
   * remove pipeline by id, if the id is undefined remove all
   * @param id pipline id or undefined
   */
  @errorHandle()
  remove(id?: string): Promise<void> {
    return del(`${this.route}/${id ? id : ''}`);
  }

  /**
   * get job info by job id
   * @param id job id
   */
  @errorHandle()
  get(id: string): Promise<JobResp> {
    return get(`${this.route}/${id}`);
  }
  info = this.get;

  /**
   * cancel job by id
   * @param id job id
   */
  @errorHandle()
  cancel(id: string): Promise<void> {
    return post(`${this.route}/${id}/cancel`);
  }

  /**
   * get job log
   * @param id job id
   */
  @errorHandle()
  log(id: string): Promise<any> {
    return get(`${this.route}/${id}/log`);
  }

  /**
   * start to run a pipeline by pipeline id
   * @param piplineId pipeline id
   */
  @errorHandle()
  run(pipelineId: string): Promise<TraceResp<JobResp>> {
    return post(`${this.route}`, { pipelineId });
  }

  // TODO(feely): browser not working
  /**
   * download model by job id
   * you should check the job status before downloading
   * @param id job id
   */
  @errorHandle()
  downloadOutput(id: string): Promise<FileDownloadResp> {
    return getFile(`${this.route}/${id}/output`);
  }

  /**
   * generate the download url for given job id
   * @param id job id
   * @experimental
   */
  @errorHandle()
  getOutputDownloadURL(id: string): string {
    return `${this.route}/${id}/output`;
  }
}
