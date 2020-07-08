import { get, post, put, del, listen } from './request';
import { route } from './router';
import { readJson } from 'fs-extra';
import { tunaMirrorURI } from './utils';

export async function list(): Promise<void> {
  return (await get(`${route.pipeline}/list`)).rows;
}

export async function info(id: string): Promise<void> {
  return await get(`${route.pipeline}/info/${id}`);
}

export async function create(filename: string, opts: any): Promise<void> {
  const config = await readJson(filename);
  return await post(`${route.pipeline}`, {
    config,
    name: opts.name,
    isFile: false
  });
}

export async function update(id: string, filename: string): Promise<void> {
  const config = await readJson(filename);
  return await put(`${route.pipeline}/${id}`, {
    config,
    isFile: false
  });
}

export async function remove(id?: any): Promise<number> {
  if (typeof id === 'string' && id !== 'all') {
    return await del(`${route.pipeline}/${id}`);
  } else {
    return await del(route.pipeline);
  }
}

export async function install(id: string, opt?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    listen(`${route.pipeline}/${id}/install`, { pyIndex: opt?.tuna ? tunaMirrorURI : undefined }, {
      'error': (e: MessageEvent) => {
        reject(new TypeError(e.data));
      },
      'finished': () => {
        resolve();
      }
    });
  });
}
