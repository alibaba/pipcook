import { Job } from './job';
import { Pipeline } from './pipeline';
export { JobStatus } from './utils';
export { JobModel, PipelineModel, JobRunOption, PipelineInstallOption } from './interface';

export class PipcookClient {
  pipeline: Pipeline;
  job: Job;

  constructor(host: string, port = 6927) {
    const url = `${host}:${port}`;
    this.pipeline = new Pipeline(url);
    this.job = new Job(url);
  }
}
