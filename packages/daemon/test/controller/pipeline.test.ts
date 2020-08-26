import { app } from 'midway-mock/bootstrap';
import { PipelineService } from '../../src/service/pipeline';
import * as sinon from 'sinon';
import assert from 'midway-mock/node_modules/@types/power-assert';

describe('test pipeline controller', () => {
  it('should list all pipelines', () => {
    return app
      .httpRequest()
      .get('/api/pipeline')
      .expect('Content-Type', /json/)
      .expect(200);
  });
  it('should get pipeline config', async () => {
    const pipelineService = await app.applicationContext.getAsync<PipelineService>('pipelineService');
    sinon.replace(pipelineService, 'getPipeline', (id: string) => {
      assert.equal(id, 'id');
      return {
        id,
        name: 'name',
        dataCollect: 'dataCollect',
        dataCollectParams: '{}',
        dataAccess: 'dataCollectParams',
        dataAccessParams: '{"a": 1}'
      };      
    });
    return app
      .httpRequest()
      .get('/api/pipeline/id/config')
      .expect('Content-Type', /json/)
      .expect(200).then((res) => {
        assert.equal(res.body.name, 'name');
        assert.equal(res.body.plugin.dataCollect.package, 'dataCollect');
        assert.equal(res.body.plugin.dataCollect.params.keys(), []);
        assert.equal(res.body.plugin.dataAccess.package, 'dataCollectParams');
        assert.equal(res.body.plugin.dataAccess.params.a, 1);
      });
  });
  it('should get pipeline info', async () => {
    const pipelineService = await app.applicationContext.getAsync<PipelineService>('pipelineService');
    sinon.replace(pipelineService, 'getPipeline', (id: string) => {
      assert.equal(id, 'id');
      return {
        id,
        name: 'name',
        dataCollect: 'dataCollect',
        dataCollectParams: '{}',
        dataAccess: 'dataCollectParams',
        dataAccessParams: '{"a": 1}'
      };      
    });
    return app
      .httpRequest()
      .get('/api/pipeline/id')
      .expect('Content-Type', /json/)
      .expect(200).then((res) => {
        assert.equal(res.body.name, 'name');
        assert.equal(res.body.dataCollect, 'dataCollect');
        assert.equal(res.body.dataCollectParams.keys(), []);
        assert.equal(res.body.dataAccess, 'dataCollectParams');
        assert.equal(res.body.dataAccessParams.a, 1);
      });
  });
});
