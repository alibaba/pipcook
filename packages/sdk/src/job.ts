import { get } from './request';
import { tunaMirrorURI } from './utils';

export class Job {
  route: string;
  constructor(host: string, port: number) {
    this.route = `${host}:${port}/job`;
  }

  async list(): Promise<any[]> {
    const jobs = await get(`${this.route}/list`);
    return jobs.rows;
  }

  async remove(): Promise<number> {
    return await get(`${this.route}/remove`);
  }

  async stop(id: string): Promise<void> {
    await get(`${this.route}/stop`, { id });
  }

  async log(id: string): Promise<any> {
    return await get(`${this.route}/${id}/log`);
  }

  async info(id: string): Promise<any> {
    return await get(`${this.route}/${id}`);
  }

  async run(opts: any): Promise<any> {
    const prarms = {
      pipelineId: opts.pipelineId,
      verbose: '0',
      pyIndex: opts.pyIndex ? tunaMirrorURI : undefined
    };
    return await get(`${this.route}/run`, prarms, { timeout: opts.timeout ? opts.timeout : 180 * 1000 });
  }
}
