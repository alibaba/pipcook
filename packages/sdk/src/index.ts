import { Job } from './job';
import { Pipeline } from './pipeline';
export { JobStatus } from './utils';

export class API {
  pipeline: Pipeline;
  job: Job;

  constructor(host: string, port = 6927) {
    this.pipeline = new Pipeline(host, port);
    this.job = new Job(host, port);
  }
}
