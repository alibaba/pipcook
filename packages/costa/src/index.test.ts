import test from 'ava';
import * as sinon from 'sinon';
import * as path from 'path';
import * as boa from '@pipcook/boa';
import * as dataCook from '@pipcook/datacook';
import { Costa, PipelineRunnerOption } from '.';
import * as utils from './utils';
import { constants, DataSourceApi, ScriptContext, ScriptType } from '@pipcook/pipcook-core';

const workspaceDir = constants.PIPCOOK_TMPDIR;

const mockOpts: PipelineRunnerOption = {
  workspace: {
    dataDir: path.join(workspaceDir, 'data'),
    cacheDir: path.join(workspaceDir, 'cache'),
    modelDir: path.join(workspaceDir, 'model'),
    frameworkDir: path.join(workspaceDir, 'framework')
  },
  framework: {
    path: path.join(workspaceDir, 'framework'),
    name: 'test-framework',
    desc: 'it\'s a test framework',
    version: '0.0.1',
    arch: null,
    platform: null,
    nodeVersion: null,
    pythonPackagePath: 'site-packages',
    jsPackagePath: 'node_modules'
  }
};

test.serial.afterEach(() => sinon.restore());

test('initialize framework', async (t) => {
  const costa = new Costa(mockOpts);
  await costa.initFramework();
  const ctx = (costa as any).context as ScriptContext;
  t.is(ctx.boa, boa, 'boa should be equal');
  t.is(ctx.dataCook, dataCook, 'dataCook should be equal');
  t.is(await ctx.importJS('path'), path, 'path should be equal');
  await t.notThrowsAsync(ctx.importPY('numpy'), 'should not throw error');
});

test('initialize framework with default path', async (t) => {
  const mockOpts: PipelineRunnerOption = {
    workspace: {
      dataDir: path.join(workspaceDir, 'data'),
      cacheDir: path.join(workspaceDir, 'cache'),
      modelDir: path.join(workspaceDir, 'model'),
      frameworkDir: path.join(workspaceDir, 'framework')
    },
    framework: {
      path: path.join(workspaceDir, 'framework'),
      name: 'test-framework',
      desc: 'it\'s a test framework',
      version: '0.0.1',
      arch: null,
      platform: null,
      nodeVersion: null,
      pythonPackagePath: null,
      jsPackagePath: null
    }
  };
  const costa = new Costa(mockOpts);
  await costa.initFramework();
  const ctx = (costa as any).context as ScriptContext;
  t.is(ctx.boa, boa, 'boa should be equal');
  t.is(ctx.dataCook, dataCook, 'dataCook should be equal');
  t.is(await ctx.importJS('path'), path, 'path should be equal');
  await t.notThrowsAsync(ctx.importPY('numpy'), 'should not throw error');
});

test.serial('run data source script', async (t) => {
  const costa = new Costa(mockOpts);
  await costa.initFramework();
  const script = {
    name: 'test script',
    path: 'mockpath',
    type: ScriptType.DataSource,
    query: {
      mockOpts: 'opts'
    }
  };
  const mockPipelineOpts = { mock: 'value' };
  const mockResult: any = { mockResult: 'value' };
  const mockModule = sinon.stub().callsFake(async (options: Record<string, any>, ctx: ScriptContext) => {
    t.is(ctx, costa.context, 'context should be equal');
    t.is(mockPipelineOpts, options, 'options should be equal');
    return mockResult;
  });
  const stubImportScript = sinon.stub(costa, 'importScript').resolves(mockModule);
  const api = await costa.runDataSource(script, mockPipelineOpts);
  t.true(stubImportScript.calledOnce, 'import should be called once');
  t.true(mockModule.calledOnce, 'module should be called once');
  t.is(api, mockResult, 'should return api');
});

test.serial('run data flow scripts', async (t) => {
  const costa = new Costa(mockOpts);
  await costa.initFramework();
  const script = {
    name: 'test script',
    path: 'mockpath',
    type: ScriptType.DataSource,
    query: {
      mockOpts: 'opts'
    }
  };
  const mockDataSourceApi: any = {};
  const mockModule = sinon.stub().callsFake(async (api: DataSourceApi<any>, opts: Record<string, any>, ctx: ScriptContext) => {
    t.is(api, mockDataSourceApi, 'api should be equal');
    t.is(ctx, costa.context, 'context should be equal');
    t.is(script.query, opts, 'options should be equal');
    return mockDataSourceApi;
  });
  const stubImportScript = sinon.stub(costa, 'importScript').resolves(mockModule);
  const api = await costa.runDataflow(mockDataSourceApi, [ script, script ]);
  t.true(stubImportScript.calledTwice, 'import should be called twice');
  t.true(mockModule.calledTwice, 'module should be called twice');
  t.is(api, mockDataSourceApi, 'should return api');
});

// test.serial('run invalid data source script', async (t) => {
//   const costa = new Costa(mockOpts);
//   await costa.initFramework();
//   const script = {
//     name: 'test script',
//     path: 'mockpath',
//     type: ScriptType.DataSource,
//     query: {
//       mockOpts: 'opts'
//     }
//   };
//   const mockPipelineOpts = { mock: 'value' };
//   const mockModule = {};
//   const stubImportFrom = sinon.stub(utils, 'importFrom').resolves(mockModule);
//   await t.throwsAsync(costa.runDataSource(script, mockPipelineOpts), {
//     instanceOf: TypeError,
//     message: `no export function found in ${script.name}(${script.path})`
//   });
//   t.true(stubImportFrom.calledOnce, 'import should be called once');
// });
