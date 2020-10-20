import { app, assert } from 'midway-mock/bootstrap';
import { MidwayMockApplication } from 'midway-mock/dist/interface';
import { PluginPackage } from '@pipcook/costa';
import { PipelineEntity } from '../../src/model/pipeline';
import * as helper from '../../src/runner/helper';
import * as sinon from 'sinon';
import { mm } from 'midway-mock/dist/mock';
import { PluginStatus } from '@pipcook/pipcook-core';

function mockGetPipeline(app: MidwayMockApplication) {
  app.mockClassFunction('pipelineService', 'getPipelinesByPrefixId', async (id: string) => {
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
    return [ obj ];
  });
}

function mockGetPipelineByName(app: MidwayMockApplication) {
  app.mockClassFunction('pipelineService', 'getPipelinesByName', async (id: string) => {
    assert.equal(id, 'id');
    return undefined;
  });
}

const mockConfig = {
  id: 'id',
  name: 'name',
  dataCollectId: 'dataCollectId',
  dataCollect: 'dataCollect',
  dataCollectParams: '{}',
  dataAccessId: 'dataAccessId',
  dataAccess: 'dataAccess',
  dataAccessParams: '{"a":1}',
  dataProcessId: 'dataProcessId',
  dataProcess: 'dataProcess',
  dataProcessParams: '{}',

  datasetProcessId: 'datasetProcessId',
  datasetProcess: 'datasetProcess',
  datasetProcessParams: '{}',

  modelDefineId: 'modelDefineId',
  modelDefine: 'modelDefine',
  modelDefineParams: '{}',

  modelLoadId: 'modelLoadId',
  modelLoad: 'modelLoad',
  modelLoadParams: '{}',

  modelTrainId: 'modelTrainId',
  modelTrain: 'modelTrain',
  modelTrainParams: '{}',

  modelEvaluateId: 'modelEvaluateId',
  modelEvaluate: 'modelEvaluate',
  modelEvaluateParams: '{}'
};
describe('test pipeline controller', () => {
  afterEach(() => {
    sinon.restore();
    mm.restore();
  });
  it('should list all pipelines', () => {
    return app
      .httpRequest()
      .get('/api/pipeline')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  it('should remove all pipelines', () => {
    const mockJobs = [ { id: '1' }, { id: '2' } ];
    app.mockClassFunction('pipelineService', 'queryJobs', async () => {
      return mockJobs;
    });
    app.mockClassFunction('pipelineService', 'removeJobByModels', async (jobs: any) => {
      assert.equal(mockJobs, jobs);
    });
    app.mockClassFunction('pipelineService', 'removePipelines', async () => {});
    return app
      .httpRequest()
      .del('/api/pipeline')
      .expect(204);
  });

  it('should remove pipeline by id', () => {
    mockGetPipeline(app);
    const mockJobs = [ { id: '1' }, { id: '2' } ];
    app.mockClassFunction('pipelineService', 'getJobsByPipelineId', async (id: string) => {
      assert.equal(id, 'id');
      return mockJobs;
    });
    app.mockClassFunction('pipelineService', 'removeJobByModels', async (jobs: any) => {
      assert.equal(mockJobs, jobs);
    });
    app.mockClassFunction('pipelineService', 'removePipelineById', async (id: string) => {
      assert.equal(id, 'id');
      return 1;
    });
    return app
      .httpRequest()
      .del('/api/pipeline/id')
      .expect(204);
  });

  it('should remove pipeline by id but pipeline not found', () => {
    app.mockClassFunction('pipelineService', 'getPipelinesByPrefixId', async (id: string) => {
      assert.equal(id, 'id');
      return [];
    });
    return app
      .httpRequest()
      .del('/api/pipeline/id')
      .expect(404);
  });
  it('get nonexistent pipeline config', () => {
    mockGetPipelineByName(app);
    app.mockClassFunction('pipelineService', 'getPipelinesByPrefixId', async (id: string): Promise<any> => {
      assert.equal(id, 'id');
      return [];
    });
    return app
      .httpRequest()
      .get('/api/pipeline/id/config')
      .expect(404);
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

  it('should get pipeline config but multiple pipelines found', async () => {
    app.mockClassFunction('pipelineService', 'getPipelinesByPrefixId', async (id: string) => {
      assert.equal(id, 'id');
      return [ {}, {} ];
    });
    return app
      .httpRequest()
      .get('/api/pipeline/id/config')
      .expect('Content-Type', /json/)
      .expect(500);
  });

  it('should get pipeline config by name', async () => {
    app.mockClassFunction('pipelineService', 'getPipelinesByName', async (name: string) => {
      assert.equal(name, 'name');
      const obj: any = {
        id: 'id',
        name,
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
    return app
      .httpRequest()
      .get('/api/pipeline/name/config')
      .expect('Content-Type', /json/)
      .expect(200).then((res) => {
        assert.equal(res.body.name, 'name');
        assert.equal(res.body.plugins.dataCollect.package, 'dataCollect');
        assert.deepEqual(res.body.plugins.dataCollect.params, {});
        assert.equal(res.body.plugins.dataAccess.package, 'dataAccess');
        assert.deepEqual(res.body.plugins.dataAccess.params, { a: 1 });
      });
  });

  it('should update pipeline config', async () => {
    const mockParseConfig = sinon.stub(helper, 'parseConfig').resolves(mockConfig);
    app.mockClassFunction('pipelineService', 'getPipelinesByPrefixId', async (id: string): Promise<any> => {
      assert.equal(id, 'id');
      return [{ id }];
    });
    app.mockClassFunction('pipelineService', 'updatePipelineById', async (id: string, config: any): Promise<any> => {
      assert.equal(id, 'id');
      assert.equal(mockConfig, config);
      return config;
    });
    const sendConfig = {
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
    };
    return app
      .httpRequest()
      .put('/api/pipeline/id').send(sendConfig)
      .expect('Content-Type', /json/)
      .expect(200).then((res) => {
        console.log(res.body);
        assert.ok(mockParseConfig.calledOnce);
        assert.equal(res.body.name, 'name');
        assert.equal(res.body.dataCollect, 'dataCollect');
        assert.deepEqual(res.body.dataCollectParams, '{}');
        assert.equal(res.body.dataAccess, 'dataAccess');
        assert.deepEqual(res.body.dataAccessParams, '{"a":1}');
      });
  });

  it('update nonexistent pipeline', async () => {
    const mockParseConfig = sinon.stub(helper, 'parseConfig').resolves(mockConfig);
    app.mockClassFunction('pipelineService', 'updatePipelineById', async (id: string, config: any): Promise<any> => {
      assert.equal(id, 'id');
      assert.equal(mockConfig, config);
      return undefined;
    });
    const sendConfig = {
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
    };
    return app
      .httpRequest()
      .put('/api/pipeline/id').send(sendConfig)
      .expect('Content-Type', /json/)
      .expect(404).expect(()=> {
        assert.ok(mockParseConfig.calledOnce);
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
  it('get nonexsitent pipeline info', async () => {
    app.mockClassFunction('pipelineService', 'getPipelinesByPrefixId', async (id: string): Promise<any> => {
      assert.equal(id, 'id');
      return [];
    });
    return app
      .httpRequest()
      .get('/api/pipeline/id')
      .expect('Content-Type', /json/)
      .expect(404);
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
  it('install nonexistent pipeline', async () => {
    app.mockClassFunction('pipelineService', 'getPipelinesByPrefixId', async (id: string): Promise<any> => {
      assert.equal(id, 'id');
      return [];
    });
    return app
      .httpRequest()
      .post('/api/pipeline/id/installation')
      .expect('Content-Type', /json/)
      .expect(404);
  });
  const installPipeline = (isError: boolean) => {
    const mockPkg = {
      name: 'dataCollect',
      version: '1.0.0'  
    }
    const mockPlugin = {
      id: 'id',
      name: 'name',
      dataCollectId: 'dataCollectId',
      dataCollect: 'dataCollect',
      dataCollectParams: '{}',
      dataAccessId: 'dataAccessId',
      dataAccess: 'dataAccess',
      dataAccessParams: '{"a":1}',
      toJSON: function () {
        return this;  
      }
    };
    app.mockClassFunction('pluginManager', 'findByName', async (name: string): Promise<any> => {
      assert.ok([ 'dataAccess', 'dataCollect' ].indexOf(name) != -1);
      if (name === 'dataAccess') {
        return {
          name: 'dataAccess',
          version: '1.0.0',
          status: PluginStatus.INSTALLED
        };
      } else {
        return {
          name: 'dataCollect',
          version: '1.0.1',
          status: PluginStatus.FAILED
        };
      }
    });
    app.mockClassFunction('pluginManager', 'fetch', async (name: string): Promise<any> => {
      assert.equal(name, mockPkg.name);
      return mockPkg;
    });
    app.mockClassFunction('pluginManager', 'findOrCreateByPkg', async (pkg: any): Promise<any> => {
      assert.deepEqual(pkg, mockPkg);
      return mockPlugin;
    });
    app.mockClassFunction('pluginManager', 'install', async (id: string, pkg: any, opts: any): Promise<any> => {
      assert.deepEqual(id, 'id');
      assert.deepEqual(pkg, mockPkg);
      if (isError) {
        throw new TypeError('mock error');
      }
    });
    app.mockClassFunction('pluginManager', 'setStatusById', async (id: string, status: PluginStatus, error: string): Promise<any> => {
      assert.deepEqual(id, 'id');
      if (status === PluginStatus.INSTALLED) {
        assert.equal(error, undefined);
      } else {
        assert.equal(error, 'mock error');
      }
    });
    mockGetPipeline(app);
    app.mockClassFunction('traceManager', 'destroy', async (id: string, err: Error): Promise<any> => {
      if (isError) {
        assert.equal(err.message, 'mock error');
      } else {
        assert.equal(err, undefined);
      }
    });
    return app
      .httpRequest()
      .post('/api/pipeline/id/installation')
      .expect('Content-Type', /json/)
      .expect(200);
  };
  it('should install pipeline', async () => {
    return installPipeline(false);
  });
  it('should install pipeline with error', async () => {
    return installPipeline(true);
  });
  it('should trace event', () => {
    app.mockClassFunction('traceManager', 'get', (id: string): any => {
      assert.equal(id, 'trace-id');
      let callback: Function;
      return {
        listen: (cb) => {
          callback = cb;
        },
        wait: async () => {
          return callback({ type: 'mock type', data: 'mock data' });
        }
      }
    });
    return app
      .httpRequest()
      .get('/api/pipeline/event/trace-id')
      .expect(200).expect((res) => {
        console.log('trace res', res.text);
        assert.ok((res.text as string).indexOf('mock type') >= 0);
        assert.ok((res.text as string).indexOf('mock data') >= 0);
      });
  });
});
