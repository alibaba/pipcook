import * as path from 'path';
import { readJson, pathExists } from 'fs-extra';
import { PipcookClient, PipelineResp, PipelineConfig } from '../../packages/sdk';
import { constants } from '../../packages/core';

describe('pipeline api.pipeline test', () => {
  const client = new PipcookClient('http://localhost', 6927);

  const name = 'bayes';
  const pipelineFile = path.join(__dirname, '../../example/pipelines/text-bayes-classification.json');
  let config: PipelineConfig;
  let pipeline: PipelineResp;
  it('prepare', async () => {
    // prepare
    config = await readJson(pipelineFile);
    await client.job.remove();
    await client.pipeline.remove();
    expect(await (await client.pipeline.list()).length).toBe(0);
    expect(await (await client.job.list()).length).toBe(0);
  });
  it('create', async () => {
    // create
    pipeline = await client.pipeline.create(config, { name });
    expect(typeof pipeline).toBe('object');
    expect(typeof pipeline.id).toBe('string');
    expect(Array.isArray(pipeline.plugins) && pipeline.plugins.length > 0);
  });
  it('list', async () => {
    // list
    let pipelines = await client.pipeline.list();
    expect(Array.isArray(pipelines));
    expect(pipeline.id).toBe(pipelines[0].id);
  });
  it('query pipeline info', async () => {
    // info
    expect((await client.pipeline.info(pipeline.id)).name).toBe(name);
  });
  it('install pipeline', async () => {
    // install Plugins
    const log = await client.pipeline.install(pipeline.id);
    await client.pipeline.traceEvent(log.traceId, (event: string, data: any) => {
      // log only for now
      expect([ 'log' ]).toContain(event);
      if (event === 'log') {
        console.log(`[${data.level}] ${data.data}`);
        expect(typeof data.level).toBe('string');
        expect(typeof data.data).toBe('string');
      }
    });
  });
  it('update pipeline', async () => {
    // update
    config.name = 'newName';
    await client.pipeline.update(pipeline.id, config);
  });
  it('remove pipeline', async () => {
    // remove
    expect(await client.pipeline.remove(pipeline.id));
    const pipelines = await client.pipeline.list();
    expect(pipelines.length).toBe(0);
    const jobs = await client.job.list();
    expect(jobs.length).toBe(0);
    expect(!await pathExists(path.join(constants.PIPCOOK_RUN, pipeline.id)));
  });
});
