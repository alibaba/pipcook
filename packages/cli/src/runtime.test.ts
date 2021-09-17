import test from 'ava';
import * as path from 'path';
import * as sinon from 'sinon';
import * as fs from 'fs-extra';
import { PipelineMeta, PipelineType, ScriptType } from '@pipcook/costa';
import * as Runtime from './runtime';
import * as utils from './utils';
import * as RT from './standalone-impl';
import { Costa } from '@pipcook/costa';
import { TaskType } from '@pipcook/core';
import { PredictDataset } from './utils';

test.serial.afterEach(() => sinon.restore());

console.log('runtime test start');

test('constructor', (t) => {
  const pipelineMeta: any = {
    mock: 'mock value'
  };
  const workspace = '/tmp';
  const mirror = 'http://a.b.c';
  const rt = new Runtime.StandaloneRuntime({
    workspace,
    pipelineMeta,
    mirror,
    enableCache: false,
    npmClient: 'npm',
    registry: undefined,
    devMode: false
  });
  t.deepEqual((rt as any).workspace, {
    dataDir: path.join(workspace, 'data'),
    modelDir: path.join(workspace, 'model'),
    cacheDir: path.join(workspace, 'cache'),
    frameworkDir: path.join(workspace, 'framework')
  }, 'workspace is not correct');
  t.deepEqual((rt as any).pipelineMeta, pipelineMeta, 'pipelineMeta is not correct');
  t.is((rt as any).mirror, mirror, 'mirror is not correct');
  t.is((rt as any).enableCache, false, 'enableCache is not correct');
  t.is((rt as any).scriptDir, path.join(workspace, 'scripts'), 'scripts is not correct');
});

test('prepare workspace', async (t) => {
  const pipelineMeta: PipelineMeta = {
    specVersion: 'v2.0',
    type: PipelineType.ObjectDetection,
    datasource: 'file:///tmp/datasource.js',
    dataflow: [ 'file:///tmp/dataflow.js' ],
    model: 'file:///tmp/model.js',
    artifact: [
      {
        processor: 'my-artifact-plugin',
        option: '123'
      }
    ],
    options: {
      pipelineOption: 'abc'
    }
  };
  const workspace = '/tmp';
  const mirror = 'http://a.b.c';
  const rt = new Runtime.StandaloneRuntime({
    workspace,
    pipelineMeta,
    mirror,
    enableCache: false,
    npmClient: 'npm',
    registry: 'my-registry',
    devMode: false
  });
  const stubMkdir = sinon.stub(fs, 'mkdirp').resolves();
  await (rt as any).prepareWorkspace();
  t.is(stubMkdir.callCount, 4, 'should create 4 directories');
  const d = {
    dataDir: path.join(workspace, 'data'),
    modelDir: path.join(workspace, 'model'),
    cacheDir: path.join(workspace, 'cache')
  };
  t.is(d.cacheDir, stubMkdir.args[0][0], `should equal to ${d.cacheDir}`);
  t.is(d.dataDir, stubMkdir.args[1][0], `should equal to ${d.dataDir}`);
  t.is(d.modelDir, stubMkdir.args[2][0], `should equal to ${d.modelDir}`);
  t.is(path.join(workspace, 'scripts'), stubMkdir.args[3][0], 'directory of scripts is not correct');
});

async function run(t: any, taskType: TaskType, runDataflow: boolean) {
  console.log('runtime test: run start.', taskType, runDataflow);
  const pipelineMeta: PipelineMeta = {
    specVersion: 'v2.0',
    type: PipelineType.ObjectDetection,
    datasource: 'file:///tmp/datasource.js',
    dataflow: [ 'file:///tmp/dataflow.js' ],
    model: 'file:///tmp/model.js',
    artifact: [
      {
        processor: 'my-artifact-plugin',
        option: '123'
      }
    ],
    options: {
      pipelineOption: 'abc'
    }
  };
  const workspace = '/tmp';
  const mirror = 'http://a.b.c';
  const datasourceMock: any = { mock: 'value' };
  const dataflowMock: any = { mock: 'value' };
  const enableCache = false;
  const rt = new Runtime.StandaloneRuntime({
    workspace,
    pipelineMeta,
    mirror,
    enableCache,
    npmClient: 'npm',
    devMode: false
  });
  const stubPrepareFramework = sinon.stub(utils.Framework, 'prepareFramework').resolves();
  const mockScript = {
    datasource: {
      name: 'datasource',
      path: '/path/to/datasource',
      type: ScriptType.DataSource,
      query: {
        a: 'a'
      }
    },
    dataflow: runDataflow ? [
      {
        name: 'dataflow',
        path: '/path/to/dataflow',
        type: ScriptType.Dataflow,
        query: {
          b: 'b'
        }
      }
    ] : null,
    model: {
      name: 'model',
      path: '/path/to/model',
      type: ScriptType.Model,
      query: {
        c: 'c'
      }
    }
  };
  const stubPrepareScript = sinon.stub(utils.Script, 'prepareScript').resolves(mockScript);
  const mockArtifact = {
    artifactExports: {
      initialize: sinon.stub(),
      build: sinon.stub()
    },
    options: {
      mock: 'value'
    }
  };
  const stubLinkCoreToScript = sinon.stub(utils.Script, 'linkCoreToScript').resolves();
  const stubPrepareArtifactPlugin = sinon.stub(utils.Plugin, 'prepareArtifactPlugin').resolves([ mockArtifact ]);
  const stubInitFramework = sinon.stub(Costa.prototype, 'initFramework').resolves();
  const stubRunDataSource =
    taskType === TaskType.TRAIN ? sinon.stub(Costa.prototype, 'runDataSource').resolves(datasourceMock) : undefined;
  const stubRunDataflow = sinon.stub(Costa.prototype, 'runDataflow').resolves(dataflowMock);
  const stubRunModel = sinon.stub(Costa.prototype, 'runModel').resolves();
  const stubWriteJson = sinon.stub(fs, 'writeJson').resolves();
  const stubRT = sinon.createStubInstance(RT.StandaloneImpl);
  const stubCreateStandaloneRT = sinon.stub(RT, 'createStandaloneRT').returns(stubRT as any);
  const stubPrepareWorkspace = sinon.stub(rt as any, 'prepareWorkspace').resolves();
  await rt.prepare();
  const inputs = [ 'mockpath' ];
  const ds = PredictDataset.makePredictDataset(inputs, PipelineType.ObjectDetection);
  if (taskType === TaskType.TRAIN) {
    await rt.train();
    t.true(stubWriteJson.calledOnce);
  } else {
    await rt.predict(ds);
  }
  t.true(stubLinkCoreToScript.called);
  t.true(stubPrepareWorkspace.calledOnce, 'should call prepareWorkspace once');
  t.true(stubPrepareFramework.calledOnce, 'should call prepareFramework once');
  t.deepEqual(
    stubPrepareFramework.args[0],
    [ pipelineMeta, path.join(workspace, 'framework'), mirror, enableCache ],
    'should call prepareScripts with correct arguments'
  );
  t.true(stubPrepareScript.calledOnce, 'should call prepareScripts once');
  t.deepEqual(
    stubPrepareScript.args[0],
    [ pipelineMeta, path.join(workspace, 'scripts'), enableCache, false ],
    'should call prepareScripts with correct arguments'
  );
  t.true(stubPrepareArtifactPlugin.calledOnce, 'prepareArtifactPlugin should be called once');
  t.deepEqual(
    stubPrepareArtifactPlugin.args[0],
    [ pipelineMeta, 'npm', undefined ],
    'should call prepareArtifactPlugin with correct arguments'
  );
  t.true(stubInitFramework.calledOnce, 'initFramework should be called once');
  if (stubRunDataSource) {
    t.true(stubRunDataSource.calledOnce, 'runDataSource should be called once');
    if (taskType === TaskType.TRAIN) {
      t.deepEqual(
        stubRunDataSource.args[0],
        [ mockScript.datasource ],
        'should call runDataSource with correct arguments'
      );
    } else {
      t.deepEqual(
        stubRunDataSource.args[0],
        [ inputs, pipelineMeta.type ],
        'should call runDataSource with correct arguments'
      );
    }
  }
  if (runDataflow) {
    t.true(stubRunDataflow.calledOnce, 'runDataflow should be called once');
    t.deepEqual(
      stubRunDataflow.args[0],
      taskType === TaskType.TRAIN ? [ datasourceMock, mockScript.dataflow ] : [ ds, mockScript.dataflow, TaskType.PREDICT ],
      'should call runDataflow with correct arguments'
    );
  } else {
    t.false(stubRunDataflow.called, 'runDataflow should not be called');
  }
  t.true(stubRunModel.calledOnce, 'runModel should be called once');
  t.deepEqual(
    stubRunModel.args[0],
    taskType === TaskType.TRAIN ? [ stubRT, mockScript.model, pipelineMeta.options ] : [ stubRT, mockScript.model, pipelineMeta.options, TaskType.PREDICT ],
    'should call runModel with correct arguments'
  );
  t.true(stubCreateStandaloneRT.calledOnce, 'should call createStandaloneRT once');
  if (taskType === TaskType.TRAIN) {
    t.true(mockArtifact.artifactExports.build.calledOnce, 'should call artiface build once');
  }
  console.log('runtime test: run end.', taskType, runDataflow);
}

test.serial('run train with dataflow', (t) => run(t, TaskType.TRAIN, true));
test.serial('run train without dataflow', (t) => run(t, TaskType.TRAIN, false));
test.serial('run predict with dataflow', (t) => run(t, TaskType.PREDICT, true));
test.serial('run predict without dataflow', (t) => run(t, TaskType.PREDICT, false));
