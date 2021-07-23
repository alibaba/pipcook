import test from 'ava';
import * as sinon from 'sinon';
import * as fs from 'fs-extra';
import * as semver from 'semver';
import * as pipcook from './pipcook';
import * as constants from '../constants';
import { StandaloneRuntime } from '../runtime';
import * as utils from '../utils';
const importFresh = require('import-fresh');

test.serial.afterEach(() => sinon.restore());

test.serial('fetch with cache', async (t) => {
  const mockFile = '/path/to/filename.json';
  const opts = {
    output: '/tmp',
    nocache: true,
    mirror: '',
    debug: false,
    npmClient: 'npm',
    registry: 'my-registry'
  };
  const mockPipelineConfig = { mock: 'value' };
  const stubReadJson = sinon.stub(fs, 'readJson').resolves(mockPipelineConfig);
  const stubMkdirp = sinon.stub(fs, 'mkdirp').resolves();
  const stubCopy = sinon.stub(fs, 'copy').resolves();
  const stubRun = sinon.stub(StandaloneRuntime.prototype, 'run').resolves();
  await pipcook.run(mockFile, opts);
  t.true(stubReadJson.calledOnce, 'readJson should be called once');
  t.deepEqual(stubReadJson.args[0], [ '/tmp/filename.json' ] as any, 'should read the correct file');
  t.true(stubMkdirp.calledOnce, 'mkdirp should be called once');
  t.deepEqual(stubMkdirp.args[0], [ opts.output ] as any, 'should make the correct directory');
  t.true(stubRun.calledOnce, 'run should be called once');
  t.true(stubCopy.calledOnce, 'copy should be called once');
  t.deepEqual(stubCopy.args[0], [ mockFile, '/tmp/filename.json' ] as any, 'should make the correct directory');
});

test.serial('fetch with http', async (t) => {
  const mockUrl = 'http://a.b.c/path/to/filename.json';
  const opts = {
    output: '/tmp',
    nocache: true,
    mirror: '',
    debug: false,
    npmClient: 'npm'
  };
  const mockPipelineConfig = { mock: 'value' };
  const stubReadJson = sinon.stub(fs, 'readJson').resolves(mockPipelineConfig);
  const stubMkdirp = sinon.stub(fs, 'mkdirp').resolves();
  const stubDownload = sinon.stub(utils, 'downloadWithProgress').resolves();
  const stubRun = sinon.stub(StandaloneRuntime.prototype, 'run').resolves();
  await pipcook.run(mockUrl, opts);
  t.true(stubReadJson.calledOnce, 'readJson should be called once');
  t.deepEqual(stubReadJson.args[0], [ '/tmp/filename.json' ] as any, 'should read the correct file');
  t.true(stubMkdirp.calledOnce, 'mkdirp should be called once');
  t.deepEqual(stubMkdirp.args[0], [ opts.output ] as any, 'should make the correct directory');
  t.true(stubRun.calledOnce, 'run should be called once');
  t.true(stubDownload.calledOnce, 'downloadWithProgress should be called once');
  t.deepEqual(stubDownload.args[0], [ mockUrl, '/tmp/filename.json' ] as any, 'should download the correct file');
});

test.serial('fetch with https', async (t) => {
  const mockUrl = 'https://a.b.c/path/to/filename.json';
  const opts = {
    output: '/tmp',
    nocache: true,
    mirror: '',
    debug: false,
    npmClient: 'npm'
  };
  const mockPipelineConfig = { mock: 'value' };
  const stubReadJson = sinon.stub(fs, 'readJson').resolves(mockPipelineConfig);
  const stubMkdirp = sinon.stub(fs, 'mkdirp').resolves();
  const stubDownload = sinon.stub(utils, 'downloadWithProgress').resolves();
  const stubRun = sinon.stub(StandaloneRuntime.prototype, 'run').resolves();
  await pipcook.run(mockUrl, opts);
  t.true(stubReadJson.calledOnce, 'readJson should be called once');
  t.deepEqual(stubReadJson.args[0], [ '/tmp/filename.json' ] as any, 'should read the correct file');
  t.true(stubMkdirp.calledOnce, 'mkdirp should be called once');
  t.deepEqual(stubMkdirp.args[0], [ opts.output ] as any, 'should make the correct directory');
  t.true(stubRun.calledOnce, 'run should be called once');
  t.true(stubDownload.calledOnce, 'downloadWithProgress should be called once');
  t.deepEqual(stubDownload.args[0], [ mockUrl, '/tmp/filename.json' ] as any, 'should download the correct file');
});

test.serial('fetch with invalid poptocol', async (t) => {
  const mockUrl = 'ftp://a.b.c/path/to/filename.json';
  const opts = {
    output: '/tmp',
    nocache: true,
    mirror: '',
    debug: false,
    npmClient: 'npm'
  };
  const stubMkdirp = sinon.stub(fs, 'mkdirp').resolves();
  const mockFail = sinon.stub(utils.logger, 'fail').resolves();
  await pipcook.run(mockUrl, opts),
  t.true(mockFail.calledOnce, 'fail should be called once');
  t.deepEqual(mockFail.args[0], [ 'run pipeline error: protocol \'ftp:\' not supported' ], 'should fail with correct message');
  t.true(stubMkdirp.calledOnce, 'mkdirp should be called once');
  t.deepEqual(stubMkdirp.args[0], [ opts.output ] as any, 'should make the correct directory');
});

test.serial('fetch with invalid poptocol debug', async (t) => {
  const mockUrl = 'ftp://a.b.c/path/to/filename.json';
  const opts = {
    output: '/tmp',
    nocache: true,
    mirror: '',
    debug: true,
    npmClient: 'npm'
  };
  const stubMkdirp = sinon.stub(fs, 'mkdirp').resolves();
  const mockFail = sinon.stub(utils.logger, 'fail').resolves();
  await pipcook.run(mockUrl, opts);
  t.true(mockFail.calledOnce, 'fail should be called once');
  t.true(
    mockFail.args[0][0].includes('protocol \'ftp:\' not supported') &&
    mockFail.args[0][0].includes('at ')
    , 'should fail with correct message');
  t.true(stubMkdirp.calledOnce, 'mkdirp should be called once');
  t.deepEqual(stubMkdirp.args[0], [ opts.output ] as any, 'should make the correct directory');
});

test.serial('fetch with url invalid extname', async (t) => {
  const mockUrl = 'http://a.b.c/path/to/filename.html';
  const opts = {
    output: '/tmp',
    nocache: true,
    mirror: '',
    debug: false,
    npmClient: 'npm'
  };
  const mockPipelineConfig = { mock: 'value' };
  const stubReadJson = sinon.stub(fs, 'readJson').resolves(mockPipelineConfig);
  const stubMkdirp = sinon.stub(fs, 'mkdirp').resolves();
  const stubDownload = sinon.stub(utils, 'downloadWithProgress').resolves();
  const stubRun = sinon.stub(StandaloneRuntime.prototype, 'run').resolves();
  const stubWarn = sinon.stub(console, 'warn').returns();
  await pipcook.run(mockUrl, opts);
  t.true(stubReadJson.calledOnce, 'readJson should be called once');
  t.deepEqual(stubReadJson.args[0], [ '/tmp/filename.html' ] as any, 'should read the correct file');
  t.true(stubMkdirp.calledOnce, 'mkdirp should be called once');
  t.deepEqual(stubMkdirp.args[0], [ opts.output ] as any, 'should make the correct directory');
  t.true(stubRun.calledOnce, 'run should be called once');
  t.true(stubDownload.calledOnce, 'downloadWithProgress should be called once');
  t.deepEqual(stubDownload.args[0], [ mockUrl, '/tmp/filename.html' ] as any, 'should download the correct file');
  t.true(stubWarn.calledOnce, 'should call console.warn once');
  t.deepEqual(stubWarn.args[0], [ 'pipeline configuration file should be a json file' ], 'should console.warn with correct message');
});

test.serial('clean cache', async (t) => {
  const stubRemove = sinon.stub(fs, 'remove').resolves();
  await pipcook.cacheClean();
  t.true(stubRemove.calledTwice, 'remove should be called twice');
  t.deepEqual(stubRemove.args, [
    [ constants.PIPCOOK_FRAMEWORK_PATH ],
    [ constants.PIPCOOK_SCRIPT_PATH ]
  ]);
});

test.serial('node version check', async (t) => {
  const stubGte = sinon.stub(semver, 'gte').returns(false);
  const stubLog = sinon.stub(console, 'log').returns();
  const stubReadJson = sinon.stub(fs, 'readJson').resolves();
  importFresh('./pipcook');
  t.true(stubGte.calledOnce, 'semver.gte should be called once');
  t.true(stubLog.calledOnce, 'chalk.red should be called once');
  t.false(stubReadJson.called, 'should not call readJson');
});
