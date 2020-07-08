import { get, post, put, del, listen } from './request';
import { readJson } from 'fs-extra';
import { tunaMirrorURI } from './utils';

export class Pipeline {
  route: string;
  constructor(host: string, port: number) {
    this.route = `${host}:${port}/pipeline`;
  }
  async list(): Promise<void> {
    return (await get(`${this.route}/list`)).rows;
  }

  async info(id: string): Promise<void> {
    return await get(`${this.route}/info/${id}`);
  }

  async create(filename: string, opts: any): Promise<void> {
    const config = await readJson(filename);
    return await post(`${this.route}`, {
      config,
      name: opts.name,
      isFile: false
    });
  }

  async update(id: string, filename: string): Promise<void> {
    const config = await readJson(filename);
    return await put(`${this.route}/${id}`, {
      config,
      isFile: false
    });
  }

  async remove(id?: any): Promise<number> {
    if (typeof id === 'string' && id !== 'all') {
      return await del(`${this.route}/${id}`);
    } else {
      return await del(this.route);
    }
  }

  async install(id: string, opt?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      listen(`${this.route}/${id}/install`, { pyIndex: opt?.tuna ? tunaMirrorURI : undefined }, {
        'error': (e: MessageEvent) => {
          reject(new TypeError(e.data));
        },
        'finished': () => {
          resolve();
        }
      });
    });
  }
}