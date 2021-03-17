import test from 'ava';
import * as sinon from 'sinon';
import * as fs from 'fs-extra';
import * as cache from './cache';
import { prepareFramework } from './framework';
import { PipcookFramework, PipelineMeta } from '@pipcook/pipcook-core';

test.serial.afterEach(() => sinon.restore());

test.serial('prepare with invalid options', async (t) => {
  const pipelineMeta: PipelineMeta = {
    specVersion: 'test',
    dataSource: 'test',
    dataflow: [ 'test' ],
    model: 'test',
    artifacts: [],
    options: {}
  };
  const frameworkDir = 'test';

  const stubFetchWithCache = sinon.stub(cache, 'fetchWithCache').resolves();
  const stubReadJson = sinon.stub(fs, 'readJSON').resolves({});

  const ret = await prepareFramework(pipelineMeta, frameworkDir);

  t.false(stubFetchWithCache.called);
  t.false(stubReadJson.called);
  t.is(ret, undefined);
});

test.serial('prepare with valid options', async (t) => {
  const pipelineMeta: PipelineMeta = {
    specVersion: 'test',
    dataSource: 'test',
    dataflow: [ 'test' ],
    model: 'test',
    artifacts: [],
    options: {
      framework: 'test'
    }
  };

  const framework: PipcookFramework = {
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

  const ret = await prepareFramework(pipelineMeta, frameworkDir);

  const expectedRet = {
    ...framework,
    path: frameworkDir
  };

  t.true(stubFetchWithCache.calledOnce);
  t.true(stubReadJson.calledOnce);
  t.deepEqual(ret, expectedRet);
});
