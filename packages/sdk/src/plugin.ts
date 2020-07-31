import { get, post, del, uploadFile } from './request';
import { BaseApi } from './base';
import { PluginResp, TraceResp } from './interface';
import { ReadStream } from 'fs-extra';

/**
 * API for plugin
 */
export class Plugin extends BaseApi {
  constructor(url: string) {
    super(`${url}/plugin`);
  }

  /**
   * list all plugins
   */
  list(): Promise<PluginResp[]> {
    return get(`${this.route}`);
  }

  /**
   * get plugin by id
   * @param id string plugin id
   */
  get(id: string): Promise<PluginResp> {
    return get(`${this.route}/${id}`);
  }

  /**
   * remove plugin or plugins
   * @param id string if null, remove all
   */
  remove(id?: string): Promise<void> {
    return del(`${this.route}/${id ? id : ''}`);
  }

  /**
   * create by package name
   * @param name package name
   * @param pyIndex the python package index
   */
  createByName(name: string, pyIndex?: string): Promise<TraceResp<PluginResp>> {
    return post(`${this.route}`, { name, pyIndex });
  }

  /**
   * create by package stream
   * @param pkgStream file stream
   * @param pyIndex the python package index
   */
  createByTarball(pkgStream: ReadStream, pyIndex?: string): Promise<TraceResp<PluginResp>> {
    return uploadFile(`${this.route}/tarball`, pkgStream, { pyIndex });
  }
}
