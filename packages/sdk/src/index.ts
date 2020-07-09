import { Job } from './job';
import { Pipeline } from './pipeline';
export { JobStatus } from './utils';
export { JobModel, PipelineModel, JobRunOption, PipelineInstallOption } from './interface';

/**
 * Pipcook daemon sdk for javascript
 * the operations of pipeline and job is available for now.
 */
export class PipcookClient {
  pipeline: Pipeline;
  job: Job;

  /**
   * the constructor for PipcookClient
   * @param host the daemon host, like 'http://192.168.1.50'
   * @param port the port
   */
  constructor(host: string, port = 6927) {
    const url = `${host}:${port}`;
    this.pipeline = new Pipeline(url);
    this.job = new Job(url);
  }
}
