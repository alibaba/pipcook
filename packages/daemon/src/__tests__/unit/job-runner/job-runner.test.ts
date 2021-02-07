import test from 'ava';
import * as sinon from 'sinon';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as core from '@pipcook/pipcook-core';
import { JobRunner } from '../../../job-runner';
import { JobStatusChangeEvent } from '../../../services';
import { JobParam } from '../../../models';
import * as util from '../../../utils';

const runner = new JobRunner({
  job: {} as any,
  pipeline: {} as any,
  plugins: {} as any,
  tracer: {} as any,
  runnable: {} as any,
  datasetRoot: __dirname
});

const jobParams: JobParam[] = core.constants.PLUGINS.map((plugin) => {
  return { pluginType: plugin, data: {} };
});

// test JobRunner
test.serial.afterEach(() => {
  sinon.restore();
});

test('test getParam with param string and empty extra field', async (t) => {
  t.deepEqual(runner.getParams({ 'param': 'v' }, undefined as any), { param: 'v' });
});

test('test getParam with param string and extra field', async (t) => {
  t.deepEqual(runner.getParams({ 'param': 'v' }, { extraField: 'string' }), { param: 'v', extraField: 'string' });
});

test('test getParam with empty object string and empty extra field', async (t) => {
  t.deepEqual(runner.getParams({}, null as any), {});
});

test('test getParam with null and empty extra field', async (t) => {
  t.deepEqual(runner.getParams(null as any, null as any), {});
});

test('test verifyPlugin', async (t) => {
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
  t.notThrows(() => {
    runner.assertPlugin('dataCollect');
  }, 'dataCollect check');
  t.notThrows(() => {
    runner.assertPlugin('dataAccess');
  }, 'dataAccess check');
  t.notThrows(() => {
    runner.assertPlugin('dataProcess');
  }, 'dataProcess check');
  t.notThrows(() => {
    runner.assertPlugin('datasetProcess');
  }, 'datasetProcess check');
  t.notThrows(() => {
    runner.assertPlugin('modelDefine');
  }, 'modelDefine check');
  t.notThrows(() => {
    runner.assertPlugin('modelTrain');
  }, 'modelTrain check');
  t.notThrows(() => {
    runner.assertPlugin('modelEvaluate');
  }, 'modelEvaluate check');
  t.throws(() => {
    runner.assertPlugin('unkwon plugin type' as any);
  });
});

test.serial('test dispatchJobEvent', async (t) => {
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
  t.is(dispatch.callCount, 1);
  t.deepEqual(dispatch.args[0][0],
    new JobStatusChangeEvent(core.PipelineStatus.SUCCESS, 'dataCollect', 'start'));
});

test.serial('test runPlugin', async (t) => {
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
  t.is(await runner.runPlugin('dataCollect', args), 'mock result');
  t.is(start.callCount, 1);
  t.deepEqual(start.args[0], [ plugin, args ]);

  t.is(dispatch.callCount, 2);
  t.deepEqual(dispatch.args[0][0],
    new JobStatusChangeEvent(core.PipelineStatus.RUNNING, 'dataCollect', 'start'));
  t.deepEqual(dispatch.args[1][0],
    new JobStatusChangeEvent(core.PipelineStatus.RUNNING, 'dataCollect', 'end'));
});

test.serial('test runDataCollect successfully', async (t) => {
  const runner = new JobRunner({
    job: {} as any,
    pipeline: {} as any,
    plugins: {
      dataCollect: {
        plugin: 'mockPlugin',
        params: { 'mockParam': 'value' }
      }
    } as any,
    tracer: {} as any,
    runnable: {} as any,
    datasetRoot: __dirname
  });
  const ensureDir = sinon.stub(fs, 'ensureDir').resolves();
  const runPlugin = sinon.stub(runner, 'runPlugin').resolves();
  await runner.runDataCollect('/data/dir', '/model/path');
  t.true(ensureDir.calledOnceWithExactly('/model/path'));
  t.deepEqual(runPlugin.args, [ [ 'dataCollect', { mockParam: 'value', dataDir: '/data/dir' } ] ]);
});

test.serial('test runDataCollect but run fails', async (t) => {
  const runner = new JobRunner({
    job: {} as any,
    pipeline: {} as any,
    plugins: {
      dataCollect: {
        plugin: 'mockPlugin',
        params: { 'mockParam': 'value' }
      }
    } as any,
    tracer: {} as any,
    runnable: {} as any,
    datasetRoot: __dirname
  });
  const ensureDir = sinon.stub(fs, 'ensureDir').resolves();
  const runPlugin = sinon.stub(runner, 'runPlugin').rejects();
  await t.throwsAsync(runner.runDataCollect('/data/dir', '/model/path'));
  t.true(ensureDir.calledOnceWith('/model/path'));
  t.deepEqual(runPlugin.args, [ [ 'dataCollect', { mockParam: 'value', dataDir: '/data/dir' } ] ]);
});

test.serial('test runDataAccess', async (t) => {
  const runner = new JobRunner({
    job: {} as any,
    pipeline: {} as any,
    plugins: {
      dataAccess: {
        plugin: 'mockPlugin',
        params: { 'mockParam': 'value' }
      }
    } as any,
    tracer: {} as any,
    runnable: {} as any,
    datasetRoot: __dirname
  });
  const runPlugin = sinon.stub(runner, 'runPlugin').resolves();
  await runner.runDataAccess('/data/dir');
  t.deepEqual(runPlugin.args, [ [ 'dataAccess', { mockParam: 'value', dataDir: '/data/dir' } ] ]);
});

test.serial('test runDatasetProcess', async (t) => {
  const runner = new JobRunner({
    job: {} as any,
    pipeline: {} as any,
    plugins: {
      datasetProcess: {
        plugin: 'mockPlugin',
        params: { 'mockParam': 'value' }
      }
    } as any,
    tracer: {} as any,
    runnable: {} as any,
    datasetRoot: __dirname
  });
  const runPlugin = sinon.stub(runner, 'runPlugin').resolves();
  const mockDataset = { mockDataset: '' };
  await runner.runDatasetProcess(mockDataset as any);
  t.deepEqual(runPlugin.args, [ [ 'datasetProcess', mockDataset, { mockParam: 'value' } ] ]);
});

test.serial('test runDatasetProcess but not exists', async (t) => {
  const runPlugin = sinon.stub(runner, 'runPlugin');
  const mockDataset = { mockDataset: '' };
  await runner.runDatasetProcess(mockDataset as any);
  t.true(runPlugin.notCalled);
});

test('test run but dataCollect not exists', async (t) => {
  await t.throwsAsync(runner.run(), { instanceOf: TypeError, message: 'plugin dataCollect must be specified' });
});

test('test runPlugin but not exists', async (t) => {
  await t.throwsAsync(runner.runPlugin('dataCollect'), { instanceOf: TypeError, message: 'plugin dataCollect is not specified' });
});

test.serial('test runDataProcess', async (t) => {
  const runner = new JobRunner({
    job: {} as any,
    pipeline: {} as any,
    plugins: {
      dataProcess: {
        plugin: 'mockPlugin',
        params: { 'mockParam': 'value' }
      }
    } as any,
    tracer: {} as any,
    runnable: {} as any,
    datasetRoot: __dirname
  });
  const runPlugin = sinon.stub(runner, 'runPlugin').resolves();
  const mockDataset = { mockDataset: '' };
  await runner.runDataProcess(mockDataset as any);
  t.deepEqual(runPlugin.args, [ [ 'dataProcess', mockDataset, { mockParam: 'value' } ] ]);
});

test.serial('test runDataProcess but not exists', async (t) => {
  const runPlugin = sinon.stub(runner, 'runPlugin');
  const mockDataset = { mockDataset: '' };
  await runner.runDataProcess(mockDataset as any);
  t.true(runPlugin.notCalled);
});

test('test runModelDefine', async (t) => {
  const runner = new JobRunner({
    job: {} as any,
    pipeline: {} as any,
    plugins: {
      modelDefine: {
        plugin: 'mockPlugin',
        params: { 'mockParam': 'value' }
      }
    } as any,
    tracer: {} as any,
    runnable: {} as any,
    datasetRoot: __dirname
  });
  const mockModel = { mockModel: '' };
  const runPlugin = sinon.stub(runner, 'runPlugin').resolves(mockModel as any);
  const mockDataset = { mockDataset: '' };
  t.deepEqual(await runner.runModelDefine(mockDataset as any), {
    plugin: 'mockPlugin',
    model: mockModel
  } as any);
  t.true(runPlugin.calledOnceWith('modelDefine', mockDataset, { mockParam: 'value' }));
});

test('test runModelTrain', async (t) => {
  const runner = new JobRunner({
    job: {} as any,
    pipeline: {} as any,
    plugins: {
      modelTrain: {
        plugin: 'mockPlugin',
        params: { 'mockParam': 'value' }
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
  t.is(await runner.runModelTrain(mockDataset as any, mockModel as any, '/model/path'), mockResult);
  t.deepEqual(runPlugin.args, [ [ 'modelTrain', mockDataset, mockModel, { mockParam: 'value', modelPath: '/model/path' } ] ]);
});

test('test runModelEvaluate', async (t) => {
  const runner = new JobRunner({
    job: {} as any,
    pipeline: {} as any,
    plugins: {
      modelEvaluate: {
        plugin: 'mockPlugin',
        params: { 'mockParam': 'value' }
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
  t.is(await runner.runModelEvaluate(mockDataset as any, mockModel as any, '/model/path'), mockResult);
  t.deepEqual(runPlugin.args, [
    [
      'modelEvaluate',
      mockDataset,
      mockModel,
      { mockParam: 'value', modelDir: '/model/path' }
    ]
  ]);
});

test('test runModelEvaluate but plugin not found', async (t) => {
  const mockModel = { mockModel: '' };
  const runPlugin = sinon.stub(runner, 'runPlugin').resolves();
  const mockDataset = { mockDataset: '' };
  await t.throwsAsync(runner.runModelEvaluate(mockDataset as any, mockModel as any, '/model/path'));
  t.true(runPlugin.notCalled);
});

test.serial('test run with model define', async (t) => {
  const runner = new JobRunner({
    job: {
      params: jobParams
    } as any,
    pipeline: {} as any,
    plugins: {
      dataCollect: {
        plugin: { name: 'mockDataCollect', version: 1 },
        params: { 'mockParam': 'dataCollect' }
      },
      dataAccess: {
        plugin: 'mockDataAccess',
        params: { 'mockParam': 'dataAccess' }
      },
      dataProcess: {
        plugin: 'mockDataProcess',
        params: { 'mockParam': 'dataProcess' }
      },
      modelDefine: {
        plugin: 'mockModelDefine',
        params: { 'mockParam': 'modeDefine' }
      },
      modelTrain: {
        plugin: 'mockModelTrain',
        params: { 'mockParam': 'modeTrain' }
      },
      modelEvaluate: {
        plugin: 'mockModelEvaluate',
        params: { 'mockParam': 'modelEvaluate' }
      }
    } as any,
    tracer: {} as any,
    runnable: { workingDir: '/workingDir' } as any,
    datasetRoot: __dirname
  });
  const mockDataset = { mockDataset: '' };
  const mockModel = { mockModel: '' };
  const mockModelAfterTraining = { mockModel: 'after training' };
  const mockModelDefineResult = {
    model: mockModel as any,
    plugin: 'modelDefine' as any
  };
  const runDataCollect = sinon.stub(runner, 'runDataCollect').resolves();
  const runDataAccess = sinon.stub(runner, 'runDataAccess').resolves(mockDataset as any);
  const runDataProcess = sinon.stub(runner, 'runDataProcess').resolves();
  const runDatasetProcess = sinon.stub(runner, 'runDatasetProcess').resolves();
  const runModelDefine = sinon.stub(runner, 'runModelDefine').resolves(mockModelDefineResult);
  const runModelTrain = sinon.stub(runner, 'runModelTrain').resolves(mockModelAfterTraining as any);
  const runModelEvaluate = sinon.stub(runner, 'runModelEvaluate').resolves();
  sinon.stub(util, 'copyDir').resolves();
  await runner.run();
  t.deepEqual(runDataCollect.args[0],
    [
      path.join(__dirname, 'mockDataCollect@1'),
      path.join('/workingDir', 'model')
    ]);
  t.deepEqual(runDataProcess.args[0][0], mockDataset as any, 'check runDataProcess');
  t.deepEqual(runDatasetProcess.args[0][0], mockDataset as any, 'check runDatasetProcess');
  t.deepEqual(runModelDefine.args[0][0], mockDataset as any, 'check runModelDefine');
  t.true(runModelTrain.calledOnceWith(mockDataset as any, mockModel as any, path.join('/workingDir', 'model')));
  t.true(runModelEvaluate.calledOnceWith(mockDataset as any, mockModelAfterTraining as any, path.join('/workingDir', 'model')));
  t.true(runDataAccess.calledOnce);
});

test.serial('test run with no model define', async (t) => {
  const runner = new JobRunner({
    job: {} as any,
    pipeline: {} as any,
    plugins: {
      dataCollect: {
        plugin: { name: 'mockDataCollect', version: 1 },
        params: { 'mockParam': 'dataCollect' }
      },
      dataAccess: {
        plugin: 'mockDataAccess',
        params: { 'mockParam': 'dataAccess' }
      },
      dataProcess: {
        plugin: 'mockDataProcess',
        params: { 'mockParam': 'dataProcess' }
      },
      modelTrain: {
        plugin: 'mockModelTrain',
        params: { 'mockParam': 'modeTrain' }
      },
      modelEvaluate: {
        plugin: 'mockModelEvaluate',
        params: { 'mockParam': 'modelEvaluate' }
      }
    } as any,
    tracer: {} as any,
    runnable: { workingDir: '/workingDir' } as any,
    datasetRoot: __dirname
  });
  const mockDataset = { mockDataset: '' };
  sinon.stub(util, 'copyDir').resolves();
  sinon.stub(runner, 'runDataCollect').resolves();
  sinon.stub(runner, 'runDataAccess').resolves(mockDataset as any);
  sinon.stub(runner, 'runDataProcess').resolves();
  sinon.stub(runner, 'runDatasetProcess').resolves();
  await t.throwsAsync(runner.run(), { instanceOf: TypeError, message: 'plugin modelDefine must be specified.' });
});
