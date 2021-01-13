import { Job } from './job';
import { Pipeline } from './pipeline';
import { Plugin } from './plugin';
import { get } from './request';
import { VersionsResp, ConfigResp } from './interface';
import { Lib } from './lib';
export { JobStatusValue, PluginStatusValue } from './utils';
export * from './interface';

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
  endpoint: string;

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
   * The lib manager object.
   */
  lib: Lib;

  /**
   * @param protocolWithHostname the daemon hostname with protocol, like "http://192.168.1.50"
   * @param port the port
   */
  constructor(protocolWithHostname = 'http://127.0.0.1', port = 6927) {
    this.endpoint = `${protocolWithHostname}:${port}/api`;
    this.pipeline = new Pipeline(this.endpoint);
    this.job = new Job(this.endpoint);
    this.plugin = new Plugin(this.endpoint);
    this.lib = new Lib(this.endpoint);
  }

  /**
   * list versions
   */
  listVersions(): Promise<VersionsResp> {
    return get(`${this.endpoint}/versions`);
  }

  /**
   * get daemon config
   */
  getConfig(): Promise<ConfigResp> {
    return get(`${this.endpoint}/config`);
  }
}
