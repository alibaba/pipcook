import test from 'ava';
import * as sinon from 'sinon';
import * as fs from 'fs-extra';
import * as cache from './cache';
import { prepareFramework } from './framework';
import * as core from '@pipcook/core';

function mockFunctionFromGetter(obj: any, funcName: string): sinon.SinonStub {
  const mockFunc = sinon.stub();
  const getter = sinon.stub().returns(mockFunc);
  sinon.stub(obj, funcName).get(getter);
  return mockFunc;
}

test.serial.afterEach(() => sinon.restore());

test.serial('prepare with invalid options', async (t) => {
  const pipelineMeta: core.PipelineMeta = {
    specVersion: 'test',
    dataSource: 'test',
    dataflow: [ 'test' ],
    model: 'test',
    artifacts: [],
    options: {}
  };
  const frameworkDir = 'test';

  const stubFetchWithCache = sinon.stub(cache, 'fetchWithCache').resolves();
  const stubReadJson = sinon.stub(fs, 'readJson').resolves();

  const ret = await prepareFramework(pipelineMeta, frameworkDir, '');

  t.false(stubFetchWithCache.called);
  t.false(stubReadJson.called);
  t.is(ret, undefined);
});

test.serial('prepare with file protocol and zip extname', async (t) => {
  const pipelineMeta: core.PipelineMeta = {
    specVersion: 'test',
    dataSource: 'test',
    dataflow: [ 'test' ],
    model: 'test',
    artifacts: [],
    options: {
      framework: 'file:///data/a.zip'
    }
  };
  const frameworkDir = 'test';

  const stubUnzipData = mockFunctionFromGetter(core, 'unZipData').resolves();
  const stubReadJson = sinon.stub(fs, 'readJson').resolves({ mock: 'value' });

  const ret = await prepareFramework(pipelineMeta, frameworkDir);

  t.true(stubReadJson.calledOnce, 'readJson should be called once');
  t.true(stubUnzipData.calledOnce, 'unzip should be called once');
  t.deepEqual(ret, { mock: 'value', path: frameworkDir } as any);
});

test.serial('prepare with file protocol and no-zip extname', async (t) => {
  const pipelineMeta: core.PipelineMeta = {
    specVersion: 'test',
    dataSource: 'test',
    dataflow: [ 'test' ],
    model: 'test',
    artifacts: [],
    options: {
      framework: 'file:///data/a'
    }
  };
  const frameworkDir = 'test';

  const stubCopy = sinon.stub(fs, 'copy').resolves();
  const stubReadJson = sinon.stub(fs, 'readJson').resolves({ mock: 'value' });

  const ret = await prepareFramework(pipelineMeta, frameworkDir);

  t.true(stubReadJson.calledOnce, 'readJson should be called once');
  t.true(stubCopy.calledOnce, 'unzip should be called once');
  t.deepEqual(ret, { mock: 'value', path: frameworkDir } as any);
});

test.serial('prepare with valid options', async (t) => {
  const pipelineMeta: core.PipelineMeta = {
    specVersion: 'test',
    dataSource: 'test',
    dataflow: [ 'test' ],
    model: 'test',
    artifacts: [],
    options: {
      framework: 'test'
    }
  };

  const framework: core.PipcookFramework = {
    path : 'test',
    name: 'test',
    desc: 'test',
    version: 'test',
    arch: 'test',
    platform: 'test',
    nodeVersion: 'test',
    pythonPackagePath: 'test',
    jsPackagePath: 'test'
  };

  const frameworkDir = 'test';

  const stubFetchWithCache = sinon.stub(cache, 'fetchWithCache').resolves();
  const stubReadJson = sinon.stub(fs, 'readJson').resolves(framework);

  const ret = await prepareFramework(pipelineMeta, frameworkDir, '');

  const expectedRet = {
    ...framework,
    path: frameworkDir
  };

  t.true(stubFetchWithCache.calledOnce);
  t.true(stubReadJson.calledOnce);
  t.deepEqual(ret, expectedRet);
});
