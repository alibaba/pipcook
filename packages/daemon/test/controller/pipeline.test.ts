import { app, assert } from 'midway-mock/bootstrap';
import { MidwayMockApplication } from 'midway-mock/dist/interface';

function mockGetPipeline(app: MidwayMockApplication) {
  app.mockClassFunction('pipelineService', 'getPipeline', async (id: string) => {
    assert.equal(id, 'id');
    return {
      id,
      name: 'name',
      dataCollect: 'dataCollect',
      dataCollectParams: '{}',
      dataAccess: 'dataCollectParams',
      dataAccessParams: '{"a":1}'
    };
  });
}

describe('test pipeline controller', () => {
  it('should list all pipelines', () => {
    return app
      .httpRequest()
      .get('/api/pipeline')
      .expect('Content-Type', /json/)
      .expect(200);
  });
  it('should get pipeline config', async () => {
    mockGetPipeline(app);
    return app
      .httpRequest()
      .get('/api/pipeline/id/config')
      .expect('Content-Type', /json/)
      .expect(200).then((res) => {
        assert.equal(res.body.name, 'name');
        assert.equal(res.body.plugins.dataCollect.package, 'dataCollect');
        assert.deepEqual(res.body.plugins.dataCollect.params, {});
        assert.equal(res.body.plugins.dataAccess.package, 'dataCollectParams');
        assert.equal(res.body.plugins.dataAccess.params.a, 1);
      });
  });
  it('should get pipeline info', async () => {
    mockGetPipeline(app);
    return app
      .httpRequest()
      .get('/api/pipeline/id')
      .expect('Content-Type', /json/)
      .expect(200).then((res) => {
        assert.equal(res.body.name, 'name');
        assert.equal(res.body.dataCollect, 'dataCollect');
        assert.equal(res.body.dataCollectParams, '{}');
        assert.equal(res.body.dataAccess, 'dataCollectParams');
        assert.equal(res.body.dataAccessParams, '{"a":1}');
      });
  });
});
