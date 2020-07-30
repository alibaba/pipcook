import { Job } from './job';
import { Pipeline } from './pipeline';
import { Plugin } from './plugin';
export { JobStatus } from './utils';
export {
  JobResp,
  PipelineResp,
  JobRunOption,
  PipelineInstallOption,
  PluginResp,
  PluginInstallingResp
} from './interface';

/**
 * Pipcook daemon sdk for javascript
 * the operations of pipeline and job is available for now.
 */
export class PipcookClient {
  pipeline: Pipeline;
  job: Job;
  plugin: Plugin;

  /**
   * The constructor for PipcookClient
   * @param protocolWithHostname the daemon hostname with protocol, like 'http://192.168.1.50'
   * @param port the port
   */
  constructor(protocolWithHostname: string, port = 6927) {
    const url = `${protocolWithHostname}:${port}`;
    this.pipeline = new Pipeline(url);
    this.job = new Job(url);
    this.plugin = new Plugin(url);
  }
}
