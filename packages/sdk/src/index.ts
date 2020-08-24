import { Job } from './job';
import { Pipeline } from './pipeline';
import { Plugin } from './plugin';
import { get } from './request';
import { VersionsResp, ConfigResp } from './interface';
export { JobStatusValue, PluginStatusValue } from './utils';
export {
  JobResp,
  PipelineResp,
  JobRunOption,
  PipelineInstallOption,
  PluginResp,
  TraceResp
} from './interface';

/**
 * The Pipcook client to connect specific daemon endpoint.
 *
 * @example
 * ```js
 * const client = new PipcookClient();
 * const pipelines = await client.pipeline.list();
 * // [{ ...pipelines }]
 * ```
 */
export class PipcookClient {

  /**
   * The endpoint to Pipcook.
   */
  private endpoint: string;

  /**
   * The pipeline management object.
   */
  pipeline: Pipeline;

  /**
   * The job management object.
   */
  job: Job;

  /**
   * The plugin manager object.
   */
  plugin: Plugin;

  /**
   * @param protocolWithHostname the daemon hostname with protocol, like "http://192.168.1.50"
   * @param port the port
   */
  constructor(protocolWithHostname = 'http://127.0.0.1', port = 6927) {
    const url = this.endpoint = `${protocolWithHostname}:${port}/api`;
    this.pipeline = new Pipeline(url);
    this.job = new Job(url);
    this.plugin = new Plugin(url);
  }

  /**
   * list versions
   */
  listVersions(): Promise<VersionsResp> {
    return get(`${this.endpoint}/api/versions`);
  }

  /**
   * get daemon config
   */
  getConfig(): Promise<ConfigResp> {
    return get(`${this.endpoint}/api/config`);
  }
}
