import * as sinon from 'sinon';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as core from '@pipcook/pipcook-core';
import { strict as assert } from 'assert';
import { JobRunner } from '../../src/runner/job-runner';
import { JobStatusChangeEvent } from '../../src/service/trace-manager';
import { JobParam } from '../../src/model/job';
import * as util from '../../src/utils';

const runner = new JobRunner({
  job: {} as any,
  pipeline: {} as any,
  plugins: {} as any,
  tracer: {} as any,
  runnable: {} as any,
  datasetRoot: __dirname
});

const jobParams: JobParam[] = core.constants.PLUGINS.map((plugin) => {
  return { pluginType: plugin, data: {} }
});

describe('test JobRunner', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('#test getParam with param string and empty extra field', async () => {
    assert.deepEqual(runner.getParams('{ "param": "v" }', undefined), { param: 'v' });
  });

  it('#test getParam with param string and extra field', async () => {
    assert.deepEqual(runner.getParams('{ "param": "v" }', { extraField: 'string' }), { param: 'v', extraField: 'string' });
  });

  it('#test getParam with invalid param string', async () => {
    assert.throws(() => {
      runner.getParams('} "param": "v" }', null);
    });
  });

  it('#test getParam with empty object string and empty extra field', async () => {
    assert.deepEqual(runner.getParams('{}', null), {});
  });

  it('#test getParam with null and empty extra field', async () => {
    assert.deepEqual(runner.getParams(null, null), {});
  });

  it('#test verifyPlugin', async () => {
    const runner = new JobRunner({
      job: {} as any,
      pipeline: {} as any,
      plugins: {
        dataCollect: {},
        dataAccess: {}, 
        dataProcess: {},
        datasetProcess: {},
        modelLoad: {},
        modelDefine: {},
        modelTrain: {},
        modelEvaluate: {}
      } as any,
      tracer: {} as any,
      runnable: {} as any,
      datasetRoot: __dirname
    });
    assert.doesNotThrow(() => {
      runner.assertPlugin('dataCollect');
    }, 'dataCollect check');
    assert.doesNotThrow(() => {
      runner.assertPlugin('dataAccess');
    }, 'dataAccess check');
    assert.doesNotThrow(() => {
      runner.assertPlugin('dataProcess');
    }, 'dataProcess check');
    assert.doesNotThrow(() => {
      runner.assertPlugin('datasetProcess');
    }, 'datasetProcess check');
    assert.doesNotThrow(() => {
      runner.assertPlugin('modelLoad');
     }, 'modelLoad check');
    assert.doesNotThrow(() => {
      runner.assertPlugin('modelDefine');
    }, 'modelDefine check');
    assert.doesNotThrow(() => {
      runner.assertPlugin('modelTrain');
    }, 'modelTrain check');
    assert.doesNotThrow(() => {
      runner.assertPlugin('modelEvaluate');
    }, 'modelEvaluate check');
    assert.throws(() => {
      runner.assertPlugin('unkwon plugin type');
    }, 'unkwon plugin type');
  });

  it('#test dispatchJobEvent', async () => {
    const dispatch = sinon.spy();
    const runner = new JobRunner({
      job: {} as any,
      pipeline: {} as any,
      plugins: {} as any,
      tracer: {
        dispatch
      } as any,
      runnable: {} as any,
      datasetRoot: __dirname
    });
    runner.dispatchJobEvent(core.PipelineStatus.SUCCESS, 'dataCollect', 'start');
    assert.equal(dispatch.callCount, 1);
    assert.deepEqual(dispatch.args[0][0],
      new JobStatusChangeEvent(core.PipelineStatus.SUCCESS, 'dataCollect', 'start'));
  });

  it('#test runPlugin', async () => {
    const dispatch = sinon.spy();
    const start = sinon.spy(async () => {
      return Promise.resolve('mock result');
    });
    const plugin = { name: 'mockDataCollect' };
    const runner = new JobRunner({
      job: {} as any,
      pipeline: {} as any,
      plugins: { dataCollect: { plugin } } as any,
      tracer: {
        dispatch
      } as any,
      runnable: { start } as any,
      datasetRoot: __dirname
    });
    const args = [ 1, 2, 3 ];
    assert.equal(await runner.runPlugin('dataCollect', args), 'mock result');
    assert.equal(start.callCount, 1);
    assert.deepStrictEqual(start.args[0], [ plugin, args ]);
    
    assert.equal(dispatch.callCount, 2);
    assert.deepStrictEqual(dispatch.args[0][0],
      new JobStatusChangeEvent(core.PipelineStatus.RUNNING, 'dataCollect', 'start'));
    assert.deepStrictEqual(dispatch.args[1][0],
      new JobStatusChangeEvent(core.PipelineStatus.RUNNING, 'dataCollect', 'end'));
  });

  it('#test runDataCollect successfully', async () => {
    const runner = new JobRunner({
      job: {} as any,
      pipeline: {} as any,
      plugins: {
        dataCollect: {
          plugin: 'mockPlugin',
          params: '{"mockParam": "value"}'
        }
      } as any,
      tracer: {} as any,
      runnable: {} as any,
      datasetRoot: __dirname
    });
    const ensureDir = sinon.stub(fs, 'ensureDir').resolves();
    const runPlugin = sinon.stub(runner, 'runPlugin').resolves();
    await runner.runDataCollect('/data/dir', '/model/path');
    assert.ok(ensureDir.calledOnceWithExactly('/model/path'));
    assert.ok(runPlugin.calledOnceWith('dataCollect', { mockParam: 'value', dataDir: '/data/dir' }));
  });

  it('#test runDataCollect but run fails', async () => {
    const runner = new JobRunner({
      job: {} as any,
      pipeline: {} as any,
      plugins: {
        dataCollect: {
          plugin: 'mockPlugin',
          params: '{"mockParam": "value"}'
        }
      } as any,
      tracer: {} as any,
      runnable: {} as any,
      datasetRoot: __dirname
    });
    const ensureDir = sinon.stub(fs, 'ensureDir').resolves();
    const runPlugin = sinon.stub(runner, 'runPlugin').rejects();
    await assert.rejects(async () => {
      await runner.runDataCollect('/data/dir', '/model/path');
    });
    assert.ok(ensureDir.calledOnceWith('/model/path'));
    assert.ok(runPlugin.calledOnceWith('dataCollect', { mockParam: 'value', dataDir: '/data/dir' }));
  });

  it('#test runDataAccess', async () => {
    const runner = new JobRunner({
      job: {} as any,
      pipeline: {} as any,
      plugins: {
        dataAccess: {
          plugin: 'mockPlugin',
          params: '{"mockParam": "value"}'
        }
      } as any,
      tracer: {} as any,
      runnable: {} as any,
      datasetRoot: __dirname
    });
    const runPlugin = sinon.stub(runner, 'runPlugin').resolves();
    await runner.runDataAccess('/data/dir');
    assert.ok(runPlugin.calledOnceWith('dataAccess', { mockParam: 'value', dataDir: '/data/dir' }));
  });

  it('#test runDatasetProcess', async () => {
    const runner = new JobRunner({
      job: {} as any,
      pipeline: {} as any,
      plugins: {
        datasetProcess: {
          plugin: 'mockPlugin',
          params: '{"mockParam": "value"}'
        }
      } as any,
      tracer: {} as any,
      runnable: {} as any,
      datasetRoot: __dirname
    });
    const runPlugin = sinon.stub(runner, 'runPlugin').resolves();
    const mockDataset = { mockDataset: '' };
    await runner.runDatasetProcess(mockDataset);
    assert.ok(runPlugin.calledOnceWith('datasetProcess', mockDataset, { mockParam: 'value' }));
  });

  it('#test runDatasetProcess but not exists', async () => {
    const runPlugin = sinon.stub(runner, 'runPlugin');
    const mockDataset = { mockDataset: '' };
    await runner.runDatasetProcess(mockDataset);
    assert.ok(runPlugin.notCalled);
  });

  it('#test runDataProcess', async () => {
    const runner = new JobRunner({
      job: {} as any,
      pipeline: {} as any,
      plugins: {
        dataProcess: {
          plugin: 'mockPlugin',
          params: '{"mockParam": "value"}'
        }
      } as any,
      tracer: {} as any,
      runnable: {} as any,
      datasetRoot: __dirname
    });
    const runPlugin = sinon.stub(runner, 'runPlugin').resolves();
    const mockDataset = { mockDataset: '' };
    await runner.runDataProcess(mockDataset);
    assert.ok(runPlugin.calledOnceWith('dataProcess', mockDataset, { mockParam: 'value' }));
  });

  it('#test runDataProcess but not exists', async () => {
    const runPlugin = sinon.stub(runner, 'runPlugin');
    const mockDataset = { mockDataset: '' };
    await runner.runDataProcess(mockDataset);
    assert.ok(runPlugin.notCalled);
  });

  it('#test runModelDefine', async () => {
    const runner = new JobRunner({
      job: {} as any,
      pipeline: {} as any,
      plugins: {
        modelDefine: {
          plugin: 'mockPlugin',
          params: '{"mockParam": "value"}'
        }
      } as any,
      tracer: {} as any,
      runnable: {} as any,
      datasetRoot: __dirname
    });
    const mockModel = { mockModel: '' };
    const runPlugin = sinon.stub(runner, 'runPlugin').resolves(mockModel as any);
    const mockDataset = { mockDataset: '' };
    assert.deepEqual(await runner.runModelDefine(mockDataset), {
      plugin: 'mockPlugin',
      model: mockModel
    });
    assert.ok(runPlugin.calledOnceWith('modelDefine', mockDataset, { mockParam: 'value' }));
  });

  it('#test runModelLoad', async () => {
    const runner = new JobRunner({
      job: {} as any,
      pipeline: {} as any,
      plugins: {
        modelLoad: {
          plugin: 'mockPlugin',
          params: '{"mockParam": "value"}'
        }
      } as any,
      tracer: {} as any,
      runnable: {} as any,
      datasetRoot: __dirname
    });
    const mockModel = { mockModel: '' };
    const runPlugin = sinon.stub(runner, 'runPlugin').resolves(mockModel as any);
    const mockDataset = { mockDataset: '' };
    assert.deepEqual(await runner.runModelLoad(mockDataset, '/model/path'), {
      plugin: 'mockPlugin',
      model: mockModel
    });
    assert.ok(runPlugin.calledOnceWith('modelLoad', mockDataset, { mockParam: 'value', recoverPath: '/model/path' }));
  });

  it('#test runModelTrain', async () => {
    const runner = new JobRunner({
      job: { params: [ { pluginType: 'modelTrain', data: { mockJobParams: 'mockData' } } ] } as any,
      pipeline: {} as any,
      plugins: {
        modelTrain: {
          plugin: 'mockPlugin',
          params: '{"mockParam": "value"}'
        }
      } as any,
      tracer: {} as any,
      runnable: {} as any,
      datasetRoot: __dirname
    });
    const mockModel = { mockModel: '' };
    const mockResult = { mockResult: '' };
    const runPlugin = sinon.stub(runner, 'runPlugin').resolves(mockResult as any);
    const mockDataset = { mockDataset: '' };
    assert.equal(await runner.runModelTrain(mockDataset, mockModel as any, '/model/path'), mockResult);
    assert.ok(runPlugin.calledOnceWith('modelTrain', mockDataset, mockModel, {
      mockParam: 'value',
      modelPath: '/model/path',
      mockJobParams: 'mockData'
    }));
  });

  it('#test runModelEvaluate', async () => {
    const runner = new JobRunner({
      job: {} as any,
      pipeline: {} as any,
      plugins: {
        modelEvaluate: {
          plugin: 'mockPlugin',
          params: '{"mockParam": "value"}'
        }
      } as any,
      tracer: {} as any,
      runnable: {} as any,
      datasetRoot: __dirname
    });
    const mockModel = { mockModel: '' };
    const mockResult = { mockResult: '' };
    const runPlugin = sinon.stub(runner, 'runPlugin').resolves(mockResult as any);
    const mockDataset = { mockDataset: '' };
    assert.equal(await runner.runModelEvaluate(mockDataset, mockModel as any, '/model/path'), mockResult);
    assert.ok(runPlugin.calledOnceWith('modelEvaluate', mockDataset, mockModel, { mockParam: 'value', modelDir: '/model/path' }));
  });

  it('#test runModelEvaluate but plugin not found', async () => {
    const mockModel = { mockModel: '' };
    const runPlugin = sinon.stub(runner, 'runPlugin').resolves();
    const mockDataset = { mockDataset: '' };
    await assert.rejects(async () => {
      await runner.runModelEvaluate(mockDataset, mockModel as any, '/model/path');
    });
    assert.ok(runPlugin.notCalled);
  });

  it('#test run with model define', async () => {
    const runner = new JobRunner({
      job: {
        params: jobParams 
      } as any,
      pipeline: {} as any,
      plugins: {
        dataCollect: {
          plugin: { name: 'mockDataCollect', version: 1 },
          params: '{"mockParam": "dataCollect"}'
        },
        dataAccess: {
          plugin: 'mockDataAccess',
          params: '{"mockParam": "dataAccess"}'
        },
        dataProcess: {
          plugin: 'mockDataProcess',
          params: '{"mockParam": "dataProcess"}'
        },
        modelDefine: {
          plugin: 'mockModelDefine',
          params: '{"mockParam": "modeDefine"}'
        },
        modelTrain: {
          plugin: 'mockModelTrain',
          params: '{"mockParam": "modeTrain"}'
        },
        modelEvaluate: {
          plugin: 'mockModelEvaluate',
          params: '{"mockParam": "modelEvaluate"}'
        }
      } as any,
      tracer: {} as any,
      runnable: { workingDir: '/workingDir'} as any,
      datasetRoot: __dirname
    });
    const mockDataset = { mockDataset: '' };
    const mockModel = { mockModel: '' };
    const mockModelAfterTraining = { mockModel: 'after training' };
    const mockModelDefineResult = {
      model: mockModel as any,
      plugin: 'modelDefine' as any
    }
    const runDataCollect = sinon.stub(runner, 'runDataCollect').resolves();
    const runDataAccess = sinon.stub(runner, 'runDataAccess').resolves(mockDataset);
    const runDataProcess = sinon.stub(runner, 'runDataProcess').resolves();
    const runDatasetProcess = sinon.stub(runner, 'runDatasetProcess').resolves();
    const runModelDefine = sinon.stub(runner, 'runModelDefine').resolves(mockModelDefineResult);
    const runModelTrain = sinon.stub(runner, 'runModelTrain').resolves(mockModelAfterTraining as any);
    const runModelEvaluate = sinon.stub(runner, 'runModelEvaluate').resolves();
    sinon.stub(util, 'copyDir').resolves();
    await runner.run();
    assert.deepEqual(runDataCollect.args[0],
      [
        path.join(__dirname, 'mockDataCollect@1'),
        path.join('/workingDir', 'model')
      ]);
    assert.deepStrictEqual(runDataProcess.args[0][0], mockDataset, 'check runDataProcess');
    assert.deepStrictEqual(runDatasetProcess.args[0][0], mockDataset, 'check runDatasetProcess');
    assert.deepStrictEqual(runModelDefine.args[0][0], mockDataset, 'check runModelDefine');
    assert.ok(runModelTrain.calledOnceWith(mockDataset, mockModel as any, path.join('/workingDir', 'model')));
    assert.ok(runModelEvaluate.calledOnceWith(mockDataset, mockModelAfterTraining as any, path.join('/workingDir', 'model')));
    assert.ok(runDataAccess.calledOnce);
  });
  it('#test run with model load', async () => {
    const runner = new JobRunner({
      job: {} as any,
      pipeline: {} as any,
      plugins: {
        dataCollect: {
          plugin: { name: 'mockDataCollect', version: 1 },
          params: '{"mockParam": "dataCollect"}'
        },
        dataAccess: {
          plugin: 'mockDataAccess',
          params: '{"mockParam": "dataAccess"}'
        },
        dataProcess: {
          plugin: 'mockDataProcess',
          params: '{"mockParam": "dataProcess"}'
        },
        modelLoad: {
          plugin: 'mockModelLoad',
          params: '{"mockParam": "modeLoad"}'
        },
        modelTrain: {
          plugin: 'mockModelTrain',
          params: '{"mockParam": "modeTrain"}'
        },
        modelEvaluate: {
          plugin: 'mockModelEvaluate',
          params: '{"mockParam": "modelEvaluate"}'
        }
      } as any,
      tracer: {} as any,
      runnable: { workingDir: '/workingDir'} as any,
      datasetRoot: __dirname
    });
    const mockDataset = { mockDataset: '' };
    const mockModel = { mockModel: '' };
    const mockModelAfterTraining = { mockModel: 'after training' };
    const mockModelLoadResult = {
      model: mockModel as any,
      plugin: 'modelLoad' as any
    }
    const runDataCollect = sinon.stub(runner, 'runDataCollect').resolves();
    const runDataAccess = sinon.stub(runner, 'runDataAccess').resolves(mockDataset);
    const runDataProcess = sinon.stub(runner, 'runDataProcess').resolves();
    const runDatasetProcess = sinon.stub(runner, 'runDatasetProcess').resolves();
    const runModelLoad = sinon.stub(runner, 'runModelLoad').resolves(mockModelLoadResult);
    const runModelTrain = sinon.stub(runner, 'runModelTrain').resolves(mockModelAfterTraining as any);
    const runModelEvaluate = sinon.stub(runner, 'runModelEvaluate').resolves();
    sinon.stub(util, 'copyDir').resolves();
    await runner.run();
    assert.deepEqual(runDataCollect.args[0],
      [
        path.join(__dirname, 'mockDataCollect@1'),
        path.join('/workingDir', 'model')
      ]);
    assert.deepStrictEqual(runDataProcess.args[0][0], mockDataset, 'check runDataProcess');
    assert.deepStrictEqual(runDatasetProcess.args[0][0], mockDataset, 'check runDatasetProcess');
    assert.deepStrictEqual(runModelLoad.args[0][0], mockDataset, 'check runModelLoad');
    assert.ok(runModelTrain.calledOnceWith(mockDataset, mockModel as any, path.join('/workingDir', 'model')));
    assert.ok(runModelEvaluate.calledOnceWith(mockDataset, mockModelAfterTraining as any, path.join('/workingDir', 'model')));
    assert.ok(runDataAccess.calledOnce);
  });
});
