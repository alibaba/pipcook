import { app, assert } from 'midway-mock/bootstrap';
import { readJson } from 'fs-extra';
import { join } from 'path';
import { provide, init } from 'midway';
import { MockCosta } from '../mock/mock-costa';
import { TraceResp, PipelineResp, JobResp } from '../../src/interface';
import { PipelineStatus } from '@pipcook/pipcook-core';

@provide('pluginRT')
class MockPluginRT {
  costa: MockCosta;
  @init()
  async connect(): Promise<void> {
    this.costa = new MockCosta();
  }
}
describe('test job controller', async () => {
  const pipelineConfig = await readJson(join(__dirname, '../../../../example/pipelines/text-bayes-classification.json'));
  let pipelineResp: PipelineResp;
  let jobResp: JobResp;
  it('remove all jobs, pipelines and plugins', async () => {
    app.applicationContext.bindClass(MockPluginRT);
    await app
      .httpRequest()
      .del('/api/job')
      .expect(204);
    await app
      .httpRequest()
      .del('/api/pipeline')
      .expect(204);
    await app
      .httpRequest()
      .del('/api/plugin')
      .expect(204);
  });
  it('should list empty', () => {
    return app
      .httpRequest()
      .get('/api/job')
      .expect('Content-Type', /json/)
      .expect(200).then((res) => {
        assert.equal(res.body.length, 0);
      });
  });
  it('should get a nonexistent job', () => {
    return app
      .httpRequest()
      .get('/api/job/nonexistent-id')
      .expect('Content-Type', /json/)
      .expect(404);
  });
  it('should run a job', async () => {
    const name = 'job test';
    let tracePipelineResp: TraceResp<PipelineResp>;
    let traceJobResp: TraceResp<JobResp>;
    // create pipline
    console.log('create pipeline');
    await app
      .httpRequest()
      .post('/api/pipeline').send({ config: pipelineConfig, name })
      .expect('Content-Type', /json/)
      .expect(201).then((resp) => {
        pipelineResp = resp.body;
        assert.equal(resp.body.name, name);
        assert.equal(resp.body.dataCollect, pipelineConfig.plugins.dataCollect.package);
        assert.equal(resp.body.dataCollectParams, JSON.stringify(pipelineConfig.plugins.dataCollect.params ?? {}));
        assert.equal(resp.body.dataAccess, pipelineConfig.plugins.dataAccess.package);
        assert.equal(resp.body.dataAccessParams, JSON.stringify(pipelineConfig.plugins.dataAccess.params ?? {}));
        assert.equal(resp.body.modelDefine, pipelineConfig.plugins.modelDefine.package);
        assert.equal(resp.body.modelDefineParams, JSON.stringify(pipelineConfig.plugins.modelDefine.params ?? {}));
        assert.equal(resp.body.modelEvaluate, pipelineConfig.plugins.modelEvaluate.package);
        assert.equal(resp.body.modelEvaluateParams, JSON.stringify(pipelineConfig.plugins.modelEvaluate.params ?? {}));
      });
    // install pipeline
    console.log('install pipeline', pipelineResp.id);
    await app
      .httpRequest()
      .post(`/api/pipeline/${pipelineResp.id}/installation`)
      .expect('Content-Type', /json/)
      .expect(200).then((resp) => {
        tracePipelineResp = resp.body;
        assert.equal(resp.body.name, name);
        assert.equal(resp.body.dataCollect, pipelineConfig.plugins.dataCollect.package);
        assert.equal(resp.body.dataCollectParams, JSON.stringify(pipelineConfig.plugins.dataCollect.params ?? {}));
        assert.equal(resp.body.dataAccess, pipelineConfig.plugins.dataAccess.package);
        assert.equal(resp.body.dataAccessParams, JSON.stringify(pipelineConfig.plugins.dataAccess.params ?? {}));
        assert.equal(resp.body.modelDefine, pipelineConfig.plugins.modelDefine.package);
        assert.equal(resp.body.modelDefineParams, JSON.stringify(pipelineConfig.plugins.modelDefine.params ?? {}));
        assert.equal(resp.body.modelEvaluate, pipelineConfig.plugins.modelEvaluate.package);
        assert.equal(resp.body.modelEvaluateParams, JSON.stringify(pipelineConfig.plugins.modelEvaluate.params ?? {}));
      });
    console.log('trace installation', tracePipelineResp.traceId);
    // trace installation
    await app
      .httpRequest()
      .get(`/api/pipeline/event/${tracePipelineResp.traceId}`)
      .expect('Content-Type', /event-stream/)
      .expect(200).then((resp) => {
        console.log('install log:', resp.text);
        assert.equal(typeof resp.text, 'string');
      });
    // create job
    await app
    .httpRequest()
    .post('/api/job/').send({ pipelineId: pipelineResp.id })
    .expect('Content-Type', /json/)
    .expect(201).then((resp) => {
      traceJobResp = resp.body;
      console.log('run job', traceJobResp.id);
      assert.equal(typeof traceJobResp.traceId, 'string');
    });
    // // check job status running
    await app
      .httpRequest()
      .get(`/api/job/${traceJobResp.id}`)
      .expect('Content-Type', /json/)
      .expect(200).then((resp) => {
        assert.equal((resp.body as JobResp).status, PipelineStatus.RUNNING);
      });
    // trace job
    await app
      .httpRequest()
      .get(`/api/job/event/${traceJobResp.traceId}`)
      .expect('Content-Type', /event-stream/)
      .expect(200).then((resp) => {
        console.log('install log:', resp.text);
        assert.equal(typeof resp.text, 'string');
      });
    // check job status
    await app
      .httpRequest()
      .get(`/api/job/${traceJobResp.id}`)
      .expect('Content-Type', /json/)
      .expect(200).then((resp) => {
        jobResp = resp.body as JobResp;
        assert.equal(jobResp.status, PipelineStatus.SUCCESS);
      });
  });
  it('should download output', async () => {
    return app.httpRequest()
    .get(`/api/job/${jobResp.id}/output`)
    .expect('Content-Type', /stream/)
    .expect(200);
  });
  it('clear', async () => {
    await app
      .httpRequest()
      .del('/api/job')
      .expect(204);
    await app
      .httpRequest()
      .del('/api/pipeline')
      .expect(204);
    await app
      .httpRequest()
      .del('/api/plugin')
      .expect(204);
    await app
      .httpRequest()
      .get('/api/pipeline')
      .expect(200)
      .then((res) => {
        assert.equal(res.body.length, 0);
      });
    await app
      .httpRequest()
      .get('/api/plugin')
      .expect(200)
      .then((res) => {
        assert.equal(res.body.length, 0);
      });
    await app
      .httpRequest()
      .get('/api/job')
      .expect(200)
      .then((res) => {
        assert.equal(res.body.length, 0);
      });
  });
});
