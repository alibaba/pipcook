import { get, post, del, uploadFile } from './request';
import { BaseApi } from './base';
import { PluginResp, PluginInstallingResp } from './interface';
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
  async list(): Promise<PluginResp[]> {
    return await get(`${this.route}`);
  }

  /**
   * get plugin by id
   * @param id string plugin id
   */
  async get(id: string): Promise<PluginResp> {
    return await get(`${this.route}/${id}`);
  }

  /**
   * remove plugin or plugins
   * @param id string if null, remove all
   */
  async remove(id?: string): Promise<void> {
    return await del(`${this.route}/${id ? id : ''}`);
  }

  /**
   * create by package name
   * @param name package name
   * @param pyIndex the python package index
   */
  async createByName(name: string, pyIndex?: string): Promise<PluginInstallingResp> {
    return await post(`${this.route}`, { name, pyIndex });
  }

  /**
   * create by package stream
   * @param pkgStream file stream
   * @param pyIndex the python package index
   */
  async createByTarball(pkgStream: ReadStream, pyIndex?: string): Promise<PluginInstallingResp> {
    return await uploadFile(`${this.route}/tarball`, pkgStream, { pyIndex });
  }
}
