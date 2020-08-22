import { app, assert } from 'midway-mock/bootstrap';
import { readJson } from 'fs-extra';
import { join } from 'path';
import { provide, init } from 'midway';
import { MockCosta } from '../mock/mock-costa';
import { TraceResp, PipelineResp, PluginResp } from '../../src/interface';
import { PluginStatus } from '@pipcook/pipcook-core';

@provide('pluginRT')
class MockPluginRT {
  costa: MockCosta;
  @init()
  async connect(): Promise<void> {
    this.costa = new MockCosta();
  }
}
describe('test pipeline controller', async () => {
  const pipelineConfig = await readJson(join(__dirname, '../../../../example/pipelines/text-bayes-classification.json'));
  let pipelineResp: PipelineResp;
  it('remove all pipelines and plugins', async () => {
    app.applicationContext.bindClass(MockPluginRT);
    await app
      .httpRequest()
      .del('/api/pipeline')
      .expect(204);
    await app
      .httpRequest()
      .del('/api/plugin')
      .expect(204);
  });
  it('should list all pipelines', () => {
    return app
      .httpRequest()
      .get('/api/pipeline')
      .expect('Content-Type', /json/)
      .expect(200).then((res) => {
        assert.equal(res.body.length, 0);
      });
  });
  it('should get a nonexistent pipeline', () => {
    return app
      .httpRequest()
      .get('/api/pipeline/nonexistent-id')
      .expect('Content-Type', /json/)
      .expect(404);
  });
  it('should create a pipeline', () => {
    const name = 'pipeline-name';
    return app
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
  });
  it('should install a pipeline', async () => {
    let traceResp: TraceResp<PipelineResp>;
    console.log('install pipeline');
    // install
    await app
      .httpRequest()
      .post(`/api/pipeline/${pipelineResp.id}/installation`)
      .expect('Content-Type', /json/)
      .expect(200).then((resp) => {
        traceResp = resp.body;
        assert.equal(typeof traceResp.traceId, 'string');
      });
    console.log('trace installation');
    // trace
    await app
    .httpRequest()
    .get(`/api/pipeline/event/${traceResp.traceId}`)
    .expect('Content-Type', /event-stream/)
    .expect(200).then((resp) => {
      console.log('install log:', resp.text);
      assert.equal(typeof resp.text, 'string');
    });
    console.log('check installation');
    // check installation
    await app
    .httpRequest()
    .get('/api/plugin/')
    .expect('Content-Type', /json/)
    .expect(200).then((resp) => {
      for (const plugin of resp.body as PluginResp[]) {
        assert.equal(plugin.status, PluginStatus.INSTALLED);
      }
    });
  });
  it('should create a pipeline by invalid parameters', () => {
    return app
      .httpRequest()
      .post('/api/pipeline').send({})
      .expect('Content-Type', /json/)
      .expect(400);
  });
  it('should update a pipeline', () => {
    pipelineConfig.name = 'new-name';
    pipelineConfig.plugins.dataCollect.package = 'new-plugin';
    return app.httpRequest()
      .put(`/api/pipeline/${pipelineResp.id}`).send({ config: pipelineConfig })
      .expect('Content-Type', /json/)
      .expect(200).then((resp) => {
        assert.equal(resp.body.name, pipelineConfig.name);
        assert.equal(resp.body.dataCollect, pipelineConfig.plugins.dataCollect.package);
        assert.equal(resp.body.dataCollectParams, JSON.stringify(pipelineConfig.plugins.dataCollect.params ?? {}));
        assert.equal(resp.body.dataAccess, pipelineConfig.plugins.dataAccess.package);
        assert.equal(resp.body.dataAccessParams, JSON.stringify(pipelineConfig.plugins.dataAccess.params ?? {}));
        assert.equal(resp.body.modelDefine, pipelineConfig.plugins.modelDefine.package);
        assert.equal(resp.body.modelDefineParams, JSON.stringify(pipelineConfig.plugins.modelDefine.params ?? {}));
        assert.equal(resp.body.modelEvaluate, pipelineConfig.plugins.modelEvaluate.package);
        assert.equal(resp.body.modelEvaluateParams, JSON.stringify(pipelineConfig.plugins.modelEvaluate.params ?? {}));
      });
  });
  it('trace nonesistent', () => {
    return app
      .httpRequest()
      .get('/api/pipeline/trace/invalid-trace-id')
      .expect(404);
  });
  it('remove by id', () => {
    return app
      .httpRequest()
      .del(`/api/pipeline/${pipelineResp.id}`)
      .expect(204);
  });
  it('clear', async () => {
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
        assert.equal((res.body as PipelineResp[]).length, 0);
      });
    await app
      .httpRequest()
      .get('/api/plugin')
      .expect(200)
      .then((res) => {
        assert.equal((res.body as PluginResp[]).length, 0);
      });
  });
});
