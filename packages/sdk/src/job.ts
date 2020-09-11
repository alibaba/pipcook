import { get, getFile, del, post } from './request';
import { BaseApi } from './base';
import { JobResp, TraceResp, JobListFilter, FileDownloadResp } from './interface';
import { parse } from 'content-disposition';
/**
 * Job API object.
 */
export class Job extends BaseApi {
  /**
   * Use PipcookClient instead.
   * @private
   */
  constructor(url: string) {
    super(`${url}/job`);
  }

  /**
   * list all jobs.
   * @param filter the filter to list the jobs.
   * @returns The jobs list.
   */
  list(filter?: JobListFilter): Promise<JobResp[]> {
    return get(this.route, filter);
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
  async downloadOutput(id: string): Promise<FileDownloadResp> {
    const resp = await getFile(`${this.route}/${id}/output`);
    // header['content-disposition'] value looks like: 'attachment; filename="pipcook-output-u9fo9dlt.tar.gz"'
    const filename = parse(resp.headers['content-disposition']).parameters['filename'] || 'output.tar.gz';
    const mimeType = resp.headers['content-type'];
    return { filename, mimeType, totalBytes: resp.totalBytes, stream: resp.stream };
  }

  /**
   * generate the download url for given job id
   * @param id job id
   * @experimental
   */
  getOutputDownloadURL(id: string): string {
    return `${this.route}/${id}/output`;
  }
}
