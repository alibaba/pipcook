import { app, assert } from 'midway-mock/bootstrap';
import { readJson } from 'fs-extra';
import { join } from 'path';


describe('test pipeline controller', async () => {
  const pipelineConfig = await readJson(join(__dirname, '../../../../example/pipelines/text-bayes-classification.json'));
  it('remove all pipelines', () => {
    return app
      .httpRequest()
      .del('/api/pipeline')
      .expect(204);
  });
  it('should list all pipelines', () => {
    return app
      .httpRequest()
      .get('/api/pipeline')
      .expect('Content-Type', /json/)
      .expect(200);
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
  it('should create a pipeline by invalid parameters', () => {
    return app
      .httpRequest()
      .post('/api/pipeline').send({})
      .expect('Content-Type', /json/)
      .expect(400);
  });
  // it('should update a pipeline', () => {
  //   const modified = { ...pipelineConfig };
  //   modified.plugins.dataCollect.package = 'new-plugin';
  //   app.httpRequest()
  //     .post(`/api/pipeline/${1}`).send({ config: { modified }, name: 'new-name' })
  //     .expect('Content-Type', /json/)
  //     .expect(200);
  //   app.httpRequest()
  //     .get('/api/pipeline/')
  //     .expect('Content-Type', /json/)
  //     .expect(200);
  // });
});
