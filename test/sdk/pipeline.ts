import * as path from 'path';
import { readJson } from 'fs-extra';
import { PipcookClient, PipelineModel } from '../../packages/sdk';

describe('pipeline api.pipeline test', () => {
  const client = new PipcookClient('http://127.0.0.1', 6927);

  const name = 'bayes';
  const pipelineFile = path.join(__dirname, '../pipelines/text-bayes-classification.json');
  let config: any;
  let pipeline: PipelineModel;
  it('prepare', async () => {
    // prepare
    config = await readJson(pipelineFile);
    await client.job.remove();
    await client.pipeline.remove();
  });
  it('create', async () => {
    // create
    pipeline = await client.pipeline.create(config, { name });
    expect(typeof pipeline).toBe('object');
    expect(typeof pipeline.id).toBe('string');
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
    await client.pipeline.installPlugins(pipeline.id);
  });
  it('update pipeline', async () => {
    // update
    pipeline = await client.pipeline.update(pipeline.id, config);
  });
  it('remove pipeline', async () => {
    // remove
    expect(await client.pipeline.remove(pipeline.id)).toBe(1);
    const pipelines = await client.pipeline.list();
    expect(pipelines.length).toBe(0);
  });
});
