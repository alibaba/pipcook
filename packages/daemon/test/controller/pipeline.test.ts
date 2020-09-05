import { app, assert } from 'midway-mock/bootstrap';
import { MidwayMockApplication } from 'midway-mock/dist/interface';
import { PluginPackage } from '@pipcook/costa';
import { PipelineEntity } from '../../src/model/pipeline';

function mockGetPipeline(app: MidwayMockApplication) {
  app.mockClassFunction('pipelineService', 'getPipeline', async (id: string) => {
    assert.equal(id, 'id');
    const obj: any = {
      id,
      name: 'name',
      dataCollectId: 'dataCollectId',
      dataCollect: 'dataCollect',
      dataCollectParams: '{}',
      dataAccessId: 'dataAccessId',
      dataAccess: 'dataAccess',
      dataAccessParams: '{"a":1}'
    };
    obj.toJSON = function () {
      return this;  
    };
    return obj;
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
        assert.equal(res.body.plugins.dataAccess.package, 'dataAccess');
        assert.deepEqual(res.body.plugins.dataAccess.params, { a: 1 });
      });
  });
  it('should get pipeline info', async () => {
    mockGetPipeline(app);
    app.mockClassFunction('pluginManager', 'findByIds', async (ids: string[]) => {
      if (ids.length > 0) {
        const result = [];
        for (const id of ids) {
          result.push({
            id,
            name: `${id}PluginName`
          });
        }
        return result;
      }
    });
    return app
      .httpRequest()
      .get('/api/pipeline/id')
      .expect('Content-Type', /json/)
      .expect(200).then((res) => {
        assert.equal(res.body.name, 'name');
        assert.equal(res.body.dataCollectId, 'dataCollectId');
        assert.equal(res.body.dataCollect, 'dataCollect');
        assert.equal(res.body.dataCollectParams, '{}');
        assert.equal(res.body.dataAccessId, 'dataAccessId');
        assert.equal(res.body.dataAccess, 'dataAccess');
        assert.equal(res.body.dataAccessParams, '{"a":1}');
        console.log(res.body.plugins);
        assert.deepEqual(res.body.plugins, [
          {id: 'dataCollectId', name: 'dataCollectIdPluginName'},
          {id: 'dataAccessId', name: 'dataAccessIdPluginName'}
        ]);
      });
  });
  it('should create pipeline', async () => {
    app.mockClassFunction('pluginManager', 'fetch', async (name: string) => {
      if (name) {
        return {
          name,
          version: '1.0.0'
        };
      }
    });
    app.mockClassFunction('pluginManager', 'findOrCreateByPkg', async (pkg: PluginPackage) => {
      assert.equal(pkg.version, '1.0.0');
      if (pkg.name) {
        return {
          id: `${pkg.name}Id`,
          name: pkg.name
        };
      }
    });
    app.mockClassFunction('pluginManager', 'findByName', async (name: string) => {
      const nameList = [ 'dataCollect', 'dataAccess' ];
      assert.ok(nameList.indexOf(name) >= 0);
      if (name === 'dataCollect') {
        return {
          id: 'dataCollectInstalled',
          name: 'dataCollect',
          status: 1
        };
      }
    });
    app.mockClassFunction('pipelineService', 'createPipeline', async (pipeline: PipelineEntity) => {
      assert.equal(pipeline.name, 'name');
      assert.equal(pipeline.dataCollectId, 'dataCollectInstalled');
      assert.equal(pipeline.dataCollect, 'dataCollect');
      assert.equal(pipeline.dataCollectParams, '{"testParam":"123"}');
      assert.equal(pipeline.dataAccessId, 'dataAccessId');
      assert.equal(pipeline.dataAccess, 'dataAccess');
      assert.equal(pipeline.dataAccessParams, '{"testParam":"456"}');
      pipeline.id = 'id';
      (pipeline as any).toJSON = function () {
        return this;
      }
      return pipeline;
    });
    return app
      .httpRequest()
      .post('/api/pipeline').send({
        name: 'name',
        config: {
          plugins: {
            dataCollect: {
              package: 'dataCollect',
              params: { testParam: '123' }
            },
            dataAccess: {
              package: 'dataAccess',
              params: { testParam: '456' }
            },
          }
        }
      })
      .expect('Content-Type', /json/)
      .expect(201).then((res) => {
        assert.equal(res.body.id, 'id');
        assert.equal(res.body.name, 'name');
        assert.equal(res.body.dataCollectId, 'dataCollectInstalled');
        assert.equal(res.body.dataCollect, 'dataCollect');
        assert.equal(res.body.dataCollectParams, '{"testParam":"123"}');
        assert.equal(res.body.dataAccessId, 'dataAccessId');
        assert.equal(res.body.dataAccess, 'dataAccess');
        assert.equal(res.body.dataAccessParams, '{"testParam":"456"}');
        assert.deepEqual(res.body.plugins, [
          {id: 'dataCollectInstalled', name: 'dataCollect', status: 1},
          {id: 'dataAccessId', name: 'dataAccess'}
        ]);
      });
  });
});
