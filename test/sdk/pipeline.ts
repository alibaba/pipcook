import * as path from 'path';
import { readJson } from 'fs-extra';
import { PipcookClient, PipelineResp } from '../../packages/sdk';
import { tunaMirrorURI } from '../../packages/sdk/src/utils';

describe('pipeline api.pipeline test', () => {
  const client = new PipcookClient('http://127.0.0.1', 6927);

  const name = 'bayes';
  const pipelineFile = path.join(__dirname, '../../example/pipelines/text-bayes-classification.json');
  let config: any;
  let pipeline: PipelineResp;
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
    console.log(pipelines);
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
    await client.pipeline.log(log.logId, (level:string, data: string) => {
      console.log(`[${level}] ${data}`);
      expect(typeof level).toBe('string');
      expect(typeof data).toBe('string');
    });
  }, 180 * 1000);
  it('update pipeline', async () => {
    // update
    config.name = 'newName';
    pipeline = await client.pipeline.update(pipeline.id, config);
    expect(pipeline.name).toBe(config.name);
  });
  it('remove pipeline', async () => {
    // remove
    expect(await client.pipeline.remove(pipeline.id));
    const pipelines = await client.pipeline.list();
    expect(pipelines.length).toBe(0);
  });
});
