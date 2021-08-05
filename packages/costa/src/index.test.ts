import test from 'ava';
import * as sinon from 'sinon';
import * as os from 'os';
import * as path from 'path';
import * as boa from '@pipcook/boa';
import { Costa, DefaultDataSourceEntry, CostaOption } from '.';
import * as utils from './utils';
import { ScriptContext, DataCook, TaskType } from '@pipcook/core';
import { ScriptType } from './types';

const workspaceDir = os.tmpdir();

const mockOpts: CostaOption = {
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
    pythonVersion: null,
    nodeVersion: null,
    napiVersion: null,
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
  t.is(ctx.dataCook, DataCook, 'dataCook should be equal');
  t.is(await ctx.importJS('path'), path, 'path should be equal');
  await t.notThrowsAsync(ctx.importPY('sys'), 'should not throw error');
});

test('initialize framework with default path', async (t) => {
  const mockOpts: CostaOption = {
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
      pythonVersion: null,
      nodeVersion: null,
      napiVersion: null,
      pythonPackagePath: null,
      jsPackagePath: null
    }
  };
  const costa = new Costa(mockOpts);
  await costa.initFramework();
  const ctx = (costa as any).context as ScriptContext;
  t.is(ctx.boa, boa, 'boa should be equal');
  t.is(ctx.dataCook, DataCook, 'dataCook should be equal');
  t.is(await ctx.importJS('path'), path, 'path should be equal');
  await t.notThrowsAsync(ctx.importPY('sys'), 'should not throw error');
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
  const mockResult: any = { mockResult: 'value' };
  const mockModule = sinon.stub().callsFake(async (options: Record<string, any>, ctx: ScriptContext) => {
    t.deepEqual(ctx, costa.context, 'context should be equal');
    t.deepEqual(script.query, options, 'options should be equal');
    return mockResult;
  });
  const stubImportScript = sinon.stub(costa, 'importScript').resolves(mockModule);
  const api = await costa.runDataSource(script);
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
    type: ScriptType.Dataflow,
    query: {
      mockOpts: 'opts'
    }
  };
  const mockDataSourceApi: any = {};
  const mockModule = sinon.stub().callsFake(async (api: DefaultDataSourceEntry, opts: Record<string, any>, ctx: ScriptContext) => {
    t.is(api, mockDataSourceApi, 'api should be equal');
    t.deepEqual(ctx, costa.context, 'context should be equal');
    t.deepEqual(script.query, opts, 'options should be equal');
    return mockDataSourceApi;
  });
  const stubImportScript = sinon.stub(costa, 'importScript').resolves(mockModule);
  const api = await costa.runDataflow(mockDataSourceApi, [ script, script ]);
  t.true(stubImportScript.calledTwice, 'import should be called twice');
  t.true(mockModule.calledTwice, 'module should be called twice');
  t.is(api, mockDataSourceApi, 'should return api');
});

test.serial('run model script for train', async (t) => {
  const costa = new Costa(mockOpts);
  await costa.initFramework();
  const script = {
    name: 'test script',
    path: 'model/mockpath',
    type: ScriptType.Model,
    query: {
      mockOpts: 'opts'
    }
  };
  const mockRuntime: any = {};
  const mockModule = {
    train: sinon.stub().callsFake(async (api: DefaultDataSourceEntry, opts: Record<string, any>, ctx: ScriptContext) => {
      t.is(api, mockRuntime, 'api should be equal');
      t.deepEqual(ctx, costa.context, 'context should be equal');
      t.deepEqual(opts, Object.assign({ mockTrainOpt: 'value' }, script.query), 'options should be equal');
    }),
    predict: sinon.stub()
  };
  const modelOpts = { mock: 'value', train: { mockTrainOpt: 'value' } };
  const stubImportScript = sinon.stub(costa, 'importScript').resolves(mockModule);
  await t.notThrowsAsync(costa.runModel(mockRuntime, script, modelOpts), 'model script should end successfully');
  t.true(stubImportScript.calledOnce, 'import should be called once');
  t.true(mockModule.train.calledOnce, 'module should be called once');
});

test.serial('run model script for predict', async (t) => {
  const costa = new Costa(mockOpts);
  await costa.initFramework();
  const script = {
    name: 'test script',
    path: 'model/mockpath',
    type: ScriptType.Model,
    query: {
      mockOpts: 'opts'
    }
  };
  const mockRuntime: any = {};
  const mockModule = {
    predict: sinon.stub().callsFake(async (api: DefaultDataSourceEntry, opts: Record<string, any>, ctx: ScriptContext) => {
      t.is(api, mockRuntime, 'api should be equal');
      t.deepEqual(ctx, { ...costa.context, taskType: TaskType.PREDICT }, 'context should be equal');
      t.deepEqual(opts, Object.assign({ mockTrainOpt: 'value' }, script.query), 'options should be equal');
    }),
    train: sinon.stub()
  };
  const modelOpts = { mock: 'value', train: { mockTrainOpt: 'value' } };
  const stubImportScript = sinon.stub(costa, 'importScript').resolves(mockModule);
  await t.notThrowsAsync(costa.runModel(mockRuntime, script, modelOpts, TaskType.PREDICT), 'model script should end successfully');
  t.true(stubImportScript.calledOnce, 'import should be called once');
  t.true(mockModule.predict.calledOnce, 'module should be called once');
});

test.serial('run model script for predict but no entry found', async (t) => {
  const costa = new Costa(mockOpts);
  await costa.initFramework();
  const script = {
    name: 'test script',
    path: 'model/mockpath',
    type: ScriptType.Model,
    query: {
      mockOpts: 'opts'
    }
  };
  const mockRuntime: any = {};
  const mockModule = {
    predict: null,
    train: sinon.stub()
  };
  const modelOpts = { mock: 'value', train: { mockTrainOpt: 'value' } };
  const stubImportScript = sinon.stub(costa, 'importScript').resolves(mockModule);
  await t.throwsAsync(costa.runModel(mockRuntime, script, modelOpts, TaskType.PREDICT), { message: 'predict is not supported.' }, 'model script should end successfully');
  t.true(stubImportScript.calledOnce, 'import should be called once');
});

test.serial('import from script', async (t) => {
  const costa = new Costa(mockOpts);
  const script = {
    name: 'test script',
    path: 'mockpath',
    type: ScriptType.Model,
    query: {
      mockOpts: 'opts'
    }
  };
  const stubFn = {
    train: sinon.stub(),
    predict: sinon.stub()
  };
  const stubImportFrom = sinon.stub(utils, 'importFrom').resolves(stubFn);
  const fn = await costa.importScript<any>(script);
  t.is(fn, stubFn, 'fn should be equal');
  t.true(stubImportFrom.calledOnce, 'importFrom should be called once');
});

test.serial('import from script.default', async (t) => {
  const costa = new Costa(mockOpts);
  const script = {
    name: 'test script',
    path: 'mockpath',
    type: ScriptType.Dataflow,
    query: {
      mockOpts: 'opts'
    }
  };
  const stubFn = sinon.stub();
  const stubImportFrom = sinon.stub(utils, 'importFrom').resolves({ default: stubFn });
  const fn = await costa.importScript<any>(script);
  t.is(fn, stubFn, 'fn should be equal');
  t.true(stubImportFrom.calledOnce, 'importFrom should be called once');
});

test.serial('import from script but not function', async (t) => {
  const costa = new Costa(mockOpts);
  const script = {
    name: 'test script',
    path: 'mockpath',
    type: ScriptType.Model,
    query: {
      mockOpts: 'opts'
    }
  };
  const invalidFn = {};
  const stubImportFrom = sinon.stub(utils, 'importFrom').resolves(invalidFn);
  await t.throwsAsync(costa.importScript<any>(script), {
    instanceOf: TypeError,
    message: `no entry found in ${script.name}(${script.path})`
  });
  t.true(stubImportFrom.calledOnce, 'importFrom should be called once');
});

test.serial('import from script in the cache', async (t) => {
  const costa = new Costa(mockOpts);
  const script = {
    name: 'test script',
    path: 'mockpath',
    type: ScriptType.Model,
    query: {
      mockOpts: 'opts'
    }
  };
  const stub = sinon.stub();
  (costa as any).entriesCache = {
    'mockpath': stub
  };
  const r = await costa.importScript<any>(script);
  t.is(r, stub, 'should get the value from cache');
});

test.serial('import from datasource script which exports a function', async (t) => {
  const costa = new Costa(mockOpts);
  const script = {
    name: 'test script',
    path: 'mockpath',
    type: ScriptType.DataSource,
    query: {
      mockOpts: 'opts'
    }
  };
  const fun = sinon.stub();
  const stubImportFrom = sinon.stub(utils, 'importFrom').resolves(fun);
  const r = await costa.importScript<any>(script);
  t.true(stubImportFrom.calledOnce, 'importFrom should be called once');
  t.is(r, fun, 'should get the right function');
});

test.serial('import from datasource script which exports object', async (t) => {
  const costa = new Costa(mockOpts);
  const script = {
    name: 'test script',
    path: 'mockpath',
    type: ScriptType.DataSource,
    query: {
      mockOpts: 'opts'
    }
  };
  const fun = sinon.stub();
  const stubImportFrom = sinon.stub(utils, 'importFrom').resolves({ datasource: fun });
  const r = await costa.importScript<any>(script);
  t.true(stubImportFrom.calledOnce, 'importFrom should be called once');
  t.is(r, fun, 'should get the right function');
});

test.serial('import from datasource script which exports object but no function found', async (t) => {
  const costa = new Costa(mockOpts);
  const script = {
    name: 'test script',
    path: 'mockpath',
    type: ScriptType.DataSource,
    query: {
      mockOpts: 'opts'
    }
  };
  const stubImportFrom = sinon.stub(utils, 'importFrom').resolves({ datasource: 1 });
  await t.throwsAsync(costa.importScript<any>(script), {
    instanceOf: TypeError,
    message: `no entry found in ${script.name}(${script.path})`
  });
  t.true(stubImportFrom.calledOnce, 'importFrom should be called once');
});

test.serial('import from dataflow script which exports a function', async (t) => {
  const costa = new Costa(mockOpts);
  const script = {
    name: 'test script',
    path: 'mockpath',
    type: ScriptType.Dataflow,
    query: {
      mockOpts: 'opts'
    }
  };
  const fun = sinon.stub();
  const stubImportFrom = sinon.stub(utils, 'importFrom').resolves(fun);
  const r = await costa.importScript<any>(script);
  t.true(stubImportFrom.calledOnce, 'importFrom should be called once');
  t.is(r, fun, 'should get the right function');
});

test.serial('import from dataflow script which exports object', async (t) => {
  const costa = new Costa(mockOpts);
  const script = {
    name: 'test script',
    path: 'mockpath',
    type: ScriptType.Dataflow,
    query: {
      mockOpts: 'opts'
    }
  };
  const fun = sinon.stub();
  const stubImportFrom = sinon.stub(utils, 'importFrom').resolves({ dataflow: fun });
  const r = await costa.importScript<any>(script);
  t.true(stubImportFrom.calledOnce, 'importFrom should be called once');
  t.is(r, fun, 'should get the right function');
});

test.serial('import from dataflow script which exports object but no function found', async (t) => {
  const costa = new Costa(mockOpts);
  const script = {
    name: 'test script',
    path: 'mockpath',
    type: ScriptType.Dataflow,
    query: {
      mockOpts: 'opts'
    }
  };
  const stubImportFrom = sinon.stub(utils, 'importFrom').resolves({ dataflow: 1 });
  await t.throwsAsync(costa.importScript<any>(script), {
    instanceOf: TypeError,
    message: `no entry found in ${script.name}(${script.path})`
  });
  t.true(stubImportFrom.calledOnce, 'importFrom should be called once');
});

test.serial('import from model script which exports a function', async (t) => {
  const costa = new Costa(mockOpts);
  const script = {
    name: 'test script',
    path: 'mockpath',
    type: ScriptType.Model,
    query: {
      mockOpts: 'opts'
    }
  };
  const fun = sinon.stub();
  const stubImportFrom = sinon.stub(utils, 'importFrom').resolves(fun);
  const r = await costa.importScript<any>(script);
  t.true(stubImportFrom.calledOnce, 'importFrom should be called once');
  t.deepEqual(r,{ train: fun, predict: null }, 'should get the right function');
});

test.serial('import from model script which exports object', async (t) => {
  const costa = new Costa(mockOpts);
  const script = {
    name: 'test script',
    path: 'mockpath',
    type: ScriptType.Model,
    query: {
      mockOpts: 'opts'
    }
  };
  const fun = sinon.stub();
  const stubImportFrom = sinon.stub(utils, 'importFrom').resolves({ model: fun });
  const r = await costa.importScript<any>(script);
  t.true(stubImportFrom.calledOnce, 'importFrom should be called once');
  t.deepEqual(r, { train: fun, predict: null }, 'should get the right function');
});

test.serial('import from model script which exports object and predict entry', async (t) => {
  const costa = new Costa(mockOpts);
  const script = {
    name: 'test script',
    path: 'mockpath',
    type: ScriptType.Model,
    query: {
      mockOpts: 'opts'
    }
  };
  const train = sinon.stub();
  const predict = sinon.stub();
  const stubImportFrom = sinon.stub(utils, 'importFrom').resolves({ model: { train, predict } });
  const r = await costa.importScript<any>(script);
  t.true(stubImportFrom.calledOnce, 'importFrom should be called once');
  t.deepEqual(r, { train, predict }, 'should get the right function');
});
