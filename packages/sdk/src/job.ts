import { get } from './request';
import { route } from './router';
import { tunaMirrorURI } from './utils';

const PipelineStatus = [ 'creating', 'running', 'success', 'fail' ];

export async function list(): Promise<void> {
  const jobs = await get(`${route.job}/list`);
  return jobs.rows;
}

export async function remove(): Promise<void> {
  return await get(`${route.job}/remove`);
}

export async function stop(id: string): Promise<void> {
  return await get(`${route.job}/stop`, { id });
}

export async function log(id: string): Promise<void> {
  return await get(`${route.job}/${id}/log`);
}

export async function info(id: string): Promise<any> {
  return await get(`${route.job}/${id}`);
}

export async function run(opts: any): Promise<void> {
  const prarms = {
    pipelineId: opts.pipelineId,
    verbose: '0',
    pyIndex: opts.pyIndex ? tunaMirrorURI : undefined
  };
  return await get(`${route.job}/run`, prarms);
}
