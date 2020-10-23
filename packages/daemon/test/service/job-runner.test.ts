import * as ChileProcess from 'child_process';
import * as sinon from 'sinon';
import * as fs from 'fs-extra';
import * as core from '@pipcook/pipcook-core';
import { PluginPackage } from '@pipcook/costa';
// import * as path from 'path';
import { assert } from 'midway-mock/bootstrap';
// import { PipelineService } from '../../src/service/pipeline';
// import { Tracer } from '../../src/service/trace-manager';
import { JobEntity } from '../../src/model/job';
import { PipelineEntity } from '../../src/model/pipeline';
import { JobRunner } from '../../src/service/pipeline';

const runner = new JobRunner({
  job: {} as any,
  pipeline: {} as any,
  plugins: {} as any,
  tracer: {} as any,
  runnable: {} as any,
  datasetRoot: __dirname
});

describe('test JobRunner', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('#generate output', async () => {
    // @ts-ignore
    sinon.replace(ChileProcess, 'exec', (cmd, opts, cb) => {
      assert.equal(cmd, 'npm init -y', 'exec command check');
      assert.deepEqual(opts, { cwd: '/home/output' }, 'exec option check');
      cb();
    });
    const mockFsRemove = sinon.stub(fs, 'remove').resolves(true);
    const mockFsEnsureDir = sinon.stub(fs, 'ensureDir').resolves(true);
    const mockFsReadJson = sinon.stub(fs, 'readJSON').resolves({});
    const mockFsCopy = sinon.stub(fs, 'copy').resolves(true);
    const mockFsOutputJson = sinon.stub(fs, 'outputJSON').resolves({});
    const mockFsCompressTarFile = sinon.stub(core, 'compressTarFile').resolves();

    await runner.generateOutput({ id: 'mockId' } as JobEntity, {
      modelPath: 'mockPath',
      modelPlugin: { name: 'modelPlugin', version: 'mockVersion' } as PluginPackage,
      pipeline: {} as PipelineEntity,
      dataProcess: {
        version: 'mockVersion',
        name: 'dataProcess'
      } as PluginPackage,
      workingDir: '/home',
      template: 'mock template'
    });
    // @ts-ignore
    assert.ok(mockFsRemove.calledOnceWith('/home/output'), 'check mockFsRemove');
    assert.ok(mockFsEnsureDir.calledOnceWith('/home/output'), 'check mockFsEnsureDir');
    assert.ok(mockFsReadJson.called, 'check mockFsReadJson');
    assert.ok(mockFsCopy.called, 'check mockFsCopy');
    assert.ok(mockFsOutputJson.called, 'check mockFsOutputJson');
    assert.ok(mockFsCompressTarFile.calledOnceWith('/home/output', '/home/output.tar.gz'), 'check mockFsCompressTarFile');
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
      runner.verifyPlugin('dataCollect');
    }, 'dataCollect check');
    assert.doesNotThrow(() => {
      runner.verifyPlugin('dataAccess');
    }, 'dataAccess check');
    assert.doesNotThrow(() => {
      runner.verifyPlugin('dataProcess');
    }, 'dataProcess check');
    assert.doesNotThrow(() => {
      runner.verifyPlugin('datasetProcess');
    }, 'datasetProcess check');
    assert.doesNotThrow(() => {
      runner.verifyPlugin('modelLoad');
     }, 'modelLoad check');
    assert.doesNotThrow(() => {
      runner.verifyPlugin('modelDefine');
    }, 'modelDefine check');
    assert.doesNotThrow(() => {
      runner.verifyPlugin('modelTrain');
    }, 'modelTrain check');
    assert.doesNotThrow(() => {
      runner.verifyPlugin('modelEvaluate');
    }, 'modelEvaluate check');
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
    assert.deepEqual(dispatch.args[0][0], {
      type: 'job_status',
      data: {
        jobStatus: core.PipelineStatus.SUCCESS,
        step: 'dataCollect',
        stepAction: 'start',
        queueLength: undefined
      }
    });
  });
});
