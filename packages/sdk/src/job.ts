import { get, getFile } from './request';
import { BaseApi } from './base';
import { JobResp, JobRunOption } from './interface';

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
  async list(): Promise<JobResp[]> {
    const jobs = await get(`${this.route}/list`);
    return jobs.rows;
  }

  // TODO(feely): support remove by id
  /**
   * remove all jobs
   */
  async remove(): Promise<number> {
    return await get(`${this.route}/remove`);
  }

  /**
   * stop job by id
   * @param id job id
   */
  async stop(id: string): Promise<void> {
    await get(`${this.route}/stop`, { id });
  }

  /**
   * get job log
   * @param id job id
   */
  async log(id: string): Promise<any> {
    return await get(`${this.route}/${id}/log`);
  }

  /**
   * get job info by job id
   * @param id job id
   */
  async info(id: string): Promise<JobResp> {
    return await get(`${this.route}/${id}`);
  }

  /**
   * start to run a pipeline by pipeline id
   * @param opts piplineId: pipeline id, tuna: is using tuna mirror, timeout: query timeout
   */
  async run(opts: JobRunOption): Promise<JobResp> {
    const prarms = {
      pipelineId: opts.pipelineId,
      verbose: '0',
      pyIndex: opts.pyIndex
    };
    return await get(`${this.route}/run`, prarms, { timeout: opts.timeout ? opts.timeout : 180 * 1000 });
  }

  // TODO(feely): browser not working
  /**
   * download model by job id
   * you should check the job status before downloading
   * @param id job id
   */
  async downloadOutput(id: string): Promise<NodeJS.ReadStream> {
    return getFile(`${this.route}/${id}/output.tar.gz`);
  }
}
