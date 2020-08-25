import { get, post, del, uploadFile } from './request';
import { BaseApi } from './base';
import { PluginResp, TraceResp, PluginListParams } from './interface';
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
   * @param params params
   */
  list(params?: PluginListParams): Promise<PluginResp[]> {
    return get(`${this.route}`, params);
  }

  /**
   * get plugin by id
   * @param id string plugin id
   */
  get(id: string): Promise<PluginResp> {
    return get(`${this.route}/${id}`);
  }

  /**
   * get plugin metadata by id
   * @param id string plugin id
   */
  fetch(id: string): Promise<any> {
    return get(`${this.route}/${id}/metadata`);
  }

  /**
   * fetch specific plugin metadata by name
   * @param name the plugin name, for example "@pipcook/plugins-image-classification-data-collect"
   */
  fetchByName(name: string): Promise<any> {
    return get(`${this.route}/metadata`, { name });
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
