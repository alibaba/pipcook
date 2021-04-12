import test from 'ava';
import * as sinon from 'sinon';
import * as path from 'path';
import * as fs from 'fs-extra';
import { PipelineMeta } from '@pipcook/costa';
import { extractVersion, prepareArtifactPlugin, install } from './plugin';
import * as utils from './index';

test('extract version', (t) => {
  const name = 'plugin-name';
  const nameScope = '@scope/plugin-name';
  t.deepEqual(extractVersion(name), { name, version: 'latest' });
  t.deepEqual(extractVersion(nameScope), { name: nameScope, version: 'latest' });
  t.deepEqual(extractVersion(`${name}@1.1.0`), { name, version: '1.1.0' });
  t.deepEqual(extractVersion(`${name}@beta`), { name, version: 'beta' });
  t.deepEqual(extractVersion(`${name}@alpha`), { name, version: 'alpha' });
  t.deepEqual(extractVersion(`${nameScope}@latest`), { name: nameScope, version: 'latest' });
  t.deepEqual(extractVersion(`${nameScope}@beta`), { name: nameScope, version: 'beta' });
  t.deepEqual(extractVersion(`${nameScope}@alpha`), { name: nameScope, version: 'alpha' });
  t.deepEqual(extractVersion(`${nameScope}@latest`), { name: nameScope, version: 'latest' });
});

test.serial.afterEach(() => sinon.restore());

test.serial('should install', async (t) => {
  const name = 'test';
  const homeDir = 'test';
  const extractRes = {
    name: 'test',
    version: 'latest'
  };
  const expected = path.join(homeDir, 'node_modules', `${extractRes.name}-${extractRes.version}`);

  const stubPathExists = sinon.stub(fs, 'pathExists').resolves(true);
  const stubMkdirp = sinon.stub(fs, 'mkdirp').resolves();
  const stubExecAsync = sinon.stub(utils, 'execAsync').resolves();

  const requirePath = await install(name, homeDir);

  t.true(stubPathExists.calledOnce);
  t.false(stubMkdirp.called);
  t.true(stubExecAsync.calledOnce);
  t.is(requirePath, expected);
});

test.serial('should install and has version number and module exists', async (t) => {
  const name = 'test@1.0.1';
  const homeDir = 'test';
  const extractRes = {
    name: 'test',
    version: '1.0.1'
  };

  const expected = path.join(homeDir, 'node_modules', `${extractRes.name}-${extractRes.version}`);

  const stubPathExists = sinon.stub(fs, 'pathExists').resolves(true);
  const stubMkdirp = sinon.stub(fs, 'mkdirp').resolves();
  const stubExecAsync = sinon.stub(utils, 'execAsync').resolves();
  const requirePath = await install(name, homeDir);

  t.true(stubPathExists.calledTwice, 'stubPathExists should be called twice');
  t.false(stubMkdirp.called);
  t.false(stubExecAsync.called);
  t.is(requirePath, expected);
});

test.serial('should install and has version number and module not exists', async (t) => {
  const name = 'test@1.0.1'; // should be the full name along with its version
  const homeDir = 'test';
  const extractRes = {
    name: 'test',
    version: '1.0.1'
  };

  const expected = path.join(homeDir, 'node_modules', `${extractRes.name}-${extractRes.version}`);

  const stubPathExists = sinon.stub(fs, 'pathExists');
  stubPathExists.onFirstCall().resolves(true);
  stubPathExists.onSecondCall().resolves(false);
  const stubMkdirp = sinon.stub(fs, 'mkdirp').resolves();
  const stubExecAsync = sinon.stub(utils, 'execAsync').resolves();
  const requirePath = await install(name, homeDir);

  t.true(stubPathExists.calledTwice, 'stubPathExists should be called twice');
  t.false(stubMkdirp.called, 'stubMkdirp should not be called');
  t.true(stubExecAsync.calledOnce);
  t.is(requirePath, expected);
});

test.serial('should install and create folder', async (t) => {
  const name = 'test';
  const homeDir = 'test';
  const extractRes = {
    name: 'test',
    version: 'latest'
  };
  const expected = path.join(homeDir, 'node_modules', `${extractRes.name}-${extractRes.version}`);

  const stubPathExists = sinon.stub(fs, 'pathExists').resolves(false);
  const stubMkdirp = sinon.stub(fs, 'mkdirp').resolves();
  const stubExecAsync = sinon.stub(utils, 'execAsync').resolves();

  const requirePath = await install(name, homeDir);

  t.true(stubPathExists.calledOnce);
  t.true(stubMkdirp.calledOnce);
  t.true(stubExecAsync.calledOnce);
  t.is(requirePath, expected);
});

test.serial('should not prepare artifact plugin', async (t) => {
  const pipelineMeta: PipelineMeta = {
    specVersion: 'test',
    dataSource: 'test',
    dataflow: [ 'test' ],
    model: 'test',
    artifacts: undefined,
    options: {}
  };

  const plugins = await prepareArtifactPlugin(pipelineMeta);

  t.deepEqual(plugins, []);
});

test.serial('should prepare artifact plugin', async (t) => {
  const pipelineMeta: PipelineMeta = {
    specVersion: 'test',
    dataSource: 'test',
    dataflow: [ 'test' ],
    model: 'test',
    artifacts: [],
    options: {}
  };

  const plugins = await prepareArtifactPlugin(pipelineMeta);

  t.deepEqual(plugins, []);
});

