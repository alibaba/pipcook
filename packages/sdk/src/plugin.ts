import { get, post, del, listen, uploadFile } from './request';
import { PluginResp, PluginInstallingResp, LogCallback } from './interface';
import { ReadStream } from 'fs-extra';

/**
 * API for plugin
 */
export class Plugin {
  route: string;
  constructor(url: string) {
    this.route = `${url}/plugin`;
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
   * listen log
   * @param logId log id
   */
  log(logId: string, logCallback: LogCallback): Promise<void> {
    return new Promise((resolve, reject) => {
      listen(`${this.route}/log/${logId}`, undefined, {
        'log': (e: MessageEvent) => {
          const logObj = JSON.parse(e.data);
          if (logCallback) {
            logCallback(logObj.level, logObj.data);
          }
        },
        'error': (e: MessageEvent) => {
            reject(e.data);
        },
        'close': () => {
          resolve();
        }
      });
    })
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
