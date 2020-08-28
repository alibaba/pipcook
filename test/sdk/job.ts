import * as path from 'path';
import { readJson, mkdirp, createWriteStream, remove } from 'fs-extra';
import tar from 'tar-stream';
import { createGunzip } from 'zlib';
import { PipcookClient, PipelineResp, JobResp, TraceResp, PipelineConfig } from '../../packages/sdk';

const traceLog = (event: string, data: any) => {
  expect([ 'log' ]).toContain(event);
  if (event === 'log') {
    console.log(`[${data.level}] ${data.data}`);
    expect(typeof data.level).toBe('string');
    expect(typeof data.data).toBe('string');
  }
};

export async function extractToPath(stream: NodeJS.ReadableStream, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const extract = tar.extract();
    const gunZip = createGunzip();
    extract.on('entry', async (header, stream, next) => {
      const dist = path.join(outputPath, header.name);
      if (header.type === 'directory') {
        await mkdirp(dist);
      } else if (header.type === 'file') {
        stream.pipe(createWriteStream(dist));
      }
      stream.on('end', next);
      stream.resume();
    });
    extract.on('error', (err) => {
      reject(err);
    });
    extract.on('finish', () => {
      resolve();
    });
    gunZip.on('error', (err) => {
      reject(err);
    });
    stream.pipe(gunZip).pipe(extract);
  });
}

describe('pipeline api.job test', () => {
  const client = new PipcookClient('http://localhost', 6927);
  const name = 'bayes-job-test';
  const pipelineFile = path.join(__dirname, '../../example/pipelines/text-bayes-classification.json');
  let config: PipelineConfig;
  let pipeline: PipelineResp;
  let jobObj: JobResp;
  let jobInfoObj: JobResp;
  it('prepare', async () => {
    config = await readJson(pipelineFile);
    // prepare
    await client.job.remove();
    await client.pipeline.remove();
  });
  it('create pipeline', async () => {
    //create pipeline
    pipeline = await client.pipeline.create(config, { name });
    expect(typeof pipeline).toBe('object');
    expect(typeof pipeline.id).toBe('string');
    const pipelineTrace = await client.pipeline.install(pipeline.id);
    await client.pipeline.traceEvent(pipelineTrace.traceId, (event: string, data: any) => {
      expect([ 'log' ]).toContain(event);
      if (event === 'log') {
        console.log(`[${data.level}] ${data.data}`);
        expect(typeof data.level).toBe('string');
        expect(typeof data.data).toBe('string');
      }
    });
  });
  it('create job', async () => {
    // create job
    jobObj = await client.job.run(pipeline.id);
    expect(typeof jobObj).toBe('object');
    expect(typeof jobObj.id).toBe('string');
    expect(typeof (jobObj as TraceResp<JobResp>).traceId).toBe('string');
    await client.job.traceEvent((jobObj as TraceResp<JobResp>).traceId, (event: string, data: any) => {
      expect([ 'log', 'jobStatusChange' ]).toContain(event);
      if (event === 'log') {
        console.log(`[${data.level}] ${data.data}`);
        expect(typeof data.level).toBe('string');
        expect(typeof data.data).toBe('string');
      }
      if (event === 'jobStatusChange') {
        const { jobStatus, step, stepAction } = data;
        console.log(`[job status] ${jobStatus} ${step} ${stepAction}`);
        expect(typeof jobStatus).toBe('number');
        expect(typeof (step || '')).toBe('string');
        expect(typeof (stepAction || '')).toBe('string');
      }
    });
    const downloadObj = await client.job.downloadOutput(jobObj.id);
    await mkdirp(path.join(__dirname, 'output'));
    await extractToPath(downloadObj.stream, path.join(__dirname, 'output'));
    const metadata = await readJson(path.join(__dirname, 'output', 'metadata.json'));
    console.log('metadata', path.join(__dirname, 'output', 'metadata.json'), metadata);
    expect(metadata.pipeline.id).toBe(pipeline.id);
    expect(metadata.output.id).toBe(jobObj.id);
    expect(typeof metadata.output.dataset).toBe('string');
    expect(typeof metadata.output.evaluateMap).toBe('string');
    await remove(path.join(__dirname, 'output'));
  });
  it('query job info', async () => {
    // info
    jobInfoObj = await client.job.info(jobObj.id);
    expect(typeof jobInfoObj).toBe('object');
    expect(jobInfoObj.id).toBe(jobObj.id);
  });
  it('list job infos', async () => {
    // list
    const jobs = await client.job.list();
    expect(Array.isArray(jobs));
    expect(jobInfoObj.id).toBe(jobs[0].id);

    // list by pipeline id
    const emptyJobs = await client.job.list({ pipelineId: 'not-exist' });
    expect(Array.isArray(emptyJobs)).toBeTruthy();
    expect(emptyJobs.length).toBe(0);
  });
  it('clean', async () => {
    // stop
    if (jobInfoObj.status === 1) {
      await client.job.cancel(jobInfoObj.id);
    }
    await client.job.remove();
    await client.pipeline.remove(pipeline.id);
  });
});
