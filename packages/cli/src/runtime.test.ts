import test from 'ava';
import * as path from 'path';
import * as sinon from 'sinon';
import * as fs from 'fs-extra';
import { PipelineMeta, ScriptType } from '@pipcook/costa';
import * as Runtime from './runtime';
import * as utils from './utils';
import * as RT from './standalone-impl';
import { Costa } from '@pipcook/costa';

test.serial.afterEach(() => sinon.restore());

test('constructor', (t) => {
  const pipelineMeta: any = {
    mock: 'mock value'
  };
  const workspace = '/tmp';
  const mirror = 'http://a.b.c';
  const rt = new Runtime.StandaloneRuntime(workspace, pipelineMeta, mirror, false, 'npm');
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
  const rt = new Runtime.StandaloneRuntime(workspace, pipelineMeta, mirror, false, 'npm', 'my-registry');
  const stubMkdir = sinon.stub(fs, 'mkdirp').resolves();
  await rt.prepareWorkspace();
  t.is(stubMkdir.callCount, 5, 'should create 4 directories');
  const d = {
    dataDir: path.join(workspace, 'data'),
    modelDir: path.join(workspace, 'model'),
    cacheDir: path.join(workspace, 'cache'),
    frameworkDir: path.join(workspace, 'framework')
  };
  let i = 0;
  Object.values(d).forEach((dir) => {
    t.is(dir, stubMkdir.args[i][0], `should equal to ${dir}`);
    ++i;
  });
  t.is(path.join(workspace, 'scripts'), stubMkdir.args[i][0], 'directory of scripts is not correct');
});

async function run(t: any, runDataflow: boolean) {
  const pipelineMeta: PipelineMeta = {
    specVersion: 'v2.0',
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
  const rt = new Runtime.StandaloneRuntime(workspace, pipelineMeta, mirror, enableCache, 'npm');
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
  const stubPrepareArtifactPlugin = sinon.stub(utils.Plugin, 'prepareArtifactPlugin').resolves([ mockArtifact ]);
  const stubInitFramework = sinon.stub(Costa.prototype, 'initFramework').resolves();
  const stubRunDataSource = sinon.stub(Costa.prototype, 'runDataSource').resolves(datasourceMock);
  const stubRunDataflow = sinon.stub(Costa.prototype, 'runDataflow').resolves(dataflowMock);
  const stubRunModel = sinon.stub(Costa.prototype, 'runModel').resolves();
  const stubRT = sinon.createStubInstance(RT.StandaloneImpl);
  const stubCreateStandaloneRT = sinon.stub(RT, 'createStandaloneRT').returns(stubRT);
  const stubPrepareWorkspace = sinon.stub(rt, 'prepareWorkspace').resolves();
  await rt.run();
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
    [ pipelineMeta, path.join(workspace, 'scripts'), enableCache ],
    'should call prepareScripts with correct arguments'
  );
  t.true(stubPrepareArtifactPlugin.calledOnce, 'prepareArtifactPlugin should be called once');
  t.deepEqual(
    stubPrepareArtifactPlugin.args[0],
    [ pipelineMeta, 'npm', undefined ],
    'should call prepareArtifactPlugin with correct arguments'
  );
  t.true(stubInitFramework.calledOnce, 'initFramework should be called once');
  t.true(stubRunDataSource.calledOnce, 'runDataSource should be called once');
  t.deepEqual(
    stubRunDataSource.args[0],
    [ mockScript.datasource ],
    'should call runDataSource with correct arguments'
  );
  if (runDataflow) {
    t.true(stubRunDataflow.calledOnce, 'runDataflow should be called once');
    t.deepEqual(
      stubRunDataflow.args[0],
      [ datasourceMock, mockScript.dataflow ],
      'should call runDataflow with correct arguments'
    );
  } else {
    t.false(stubRunDataflow.called, 'runDataflow should not be called');
  }
  t.true(stubRunModel.calledOnce, 'runModel should be called once');
  t.deepEqual(
    stubRunModel.args[0],
    [ stubRT, mockScript.model, pipelineMeta.options ],
    'should call runModel with correct arguments'
  );
  t.true(stubCreateStandaloneRT.calledOnce, 'should call createStandaloneRT once');
  t.true(mockArtifact.artifactExports.build.calledOnce, 'should call artiface build once');
}

test.serial('run with dataflow', (t) => run(t, true));
test.serial('run without dataflow', (t) => run(t, false));
