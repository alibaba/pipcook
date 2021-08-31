import test from 'ava';
import * as sinon from 'sinon';
import * as fs from 'fs-extra';
import * as semver from 'semver';
import * as pipcook from './pipcook';
import * as constants from '../constants';
import { StandaloneRuntime } from '../runtime';
import * as path from 'path';
import * as utils from '../utils';
import { PipelineType } from '@pipcook/costa';
const importFresh = require('import-fresh');

test.serial.afterEach(() => sinon.restore());

test.serial('train: fetch with cache', async (t) => {
  const mockFile = '/path/to/filename.json';
  const opts = {
    output: path.resolve('/tmp'),
    nocache: true,
    mirror: '',
    debug: false,
    npmClient: 'npm',
    registry: 'my-registry',
    dev: false
  };
  const tmpFilePath = path.join(path.resolve(opts.output), 'filename.json');
  const mockPipelineConfig = { mock: 'value' };
  const stubReadJson = sinon.stub(fs, 'readJson').resolves(mockPipelineConfig);
  const stubMkdirp = sinon.stub(fs, 'mkdirp').resolves();
  const stubCopy = sinon.stub(fs, 'copy').resolves();
  const stubTrain = sinon.stub(StandaloneRuntime.prototype, 'train').resolves();
  const stubPrepare = sinon.stub(StandaloneRuntime.prototype, 'prepare').resolves();
  await pipcook.train(mockFile, opts);
  t.true(stubReadJson.calledOnce, 'readJson should be called once');
  t.deepEqual(stubReadJson.args[0], [ tmpFilePath ] as any, 'should read the correct file');
  t.true(stubMkdirp.calledOnce, 'mkdirp should be called once');
  t.deepEqual(stubMkdirp.args[0], [ opts.output ] as any, 'should make the correct directory');
  t.true(stubPrepare.calledOnce, 'prepare should be called once');
  t.true(stubTrain.calledOnce, 'train should be called once');
  t.true(stubCopy.calledOnce, 'copy should be called once');
  t.deepEqual(stubCopy.args[0], [ mockFile, tmpFilePath ] as any, 'should make the correct directory');
});

test.serial('train: fetch with http', async (t) => {
  const mockUrl = 'http://a.b.c/path/to/filename.json';
  const opts = {
    output: path.resolve('/tmp'),
    nocache: true,
    mirror: '',
    debug: false,
    npmClient: 'npm',
    dev: false
  };
  const tmpFilePath = path.join(path.resolve(opts.output), 'filename.json');
  const mockPipelineConfig = { mock: 'value' };
  const stubReadJson = sinon.stub(fs, 'readJson').resolves(mockPipelineConfig);
  const stubMkdirp = sinon.stub(fs, 'mkdirp').resolves();
  const stubDownload = sinon.stub(utils, 'downloadWithProgress').resolves();
  const stubRun = sinon.stub(StandaloneRuntime.prototype, 'train').resolves();
  const stubPrepare = sinon.stub(StandaloneRuntime.prototype, 'prepare').resolves();
  await pipcook.train(mockUrl, opts);
  t.true(stubReadJson.calledOnce, 'readJson should be called once');
  t.deepEqual(stubReadJson.args[0], [ tmpFilePath ] as any, 'should read the correct file');
  t.true(stubMkdirp.calledOnce, 'mkdirp should be called once');
  t.deepEqual(stubMkdirp.args[0], [ opts.output ] as any, 'should make the correct directory');
  t.true(stubRun.calledOnce, 'run should be called once');
  t.true(stubPrepare.calledOnce, 'prepare should be called once');
  t.true(stubDownload.calledOnce, 'downloadWithProgress should be called once');
  t.deepEqual(stubDownload.args[0], [ mockUrl, tmpFilePath ] as any, 'should download the correct file');
});

test.serial('train: fetch with https', async (t) => {
  const mockUrl = 'https://a.b.c/path/to/filename.json';
  const opts = {
    output: path.resolve('/tmp'),
    nocache: true,
    mirror: '',
    debug: false,
    npmClient: 'npm',
    dev: false
  };
  const tmpFilePath = path.join(path.resolve(opts.output), 'filename.json');
  const mockPipelineConfig = { mock: 'value' };
  const stubReadJson = sinon.stub(fs, 'readJson').resolves(mockPipelineConfig);
  const stubMkdirp = sinon.stub(fs, 'mkdirp').resolves();
  const stubDownload = sinon.stub(utils, 'downloadWithProgress').resolves();
  const stubRun = sinon.stub(StandaloneRuntime.prototype, 'train').resolves();
  const stubPrepare = sinon.stub(StandaloneRuntime.prototype, 'prepare').resolves();
  await pipcook.train(mockUrl, opts);
  t.true(stubReadJson.calledOnce, 'readJson should be called once');
  t.deepEqual(stubReadJson.args[0], [ tmpFilePath ] as any, 'should read the correct file');
  t.true(stubMkdirp.calledOnce, 'mkdirp should be called once');
  t.deepEqual(stubMkdirp.args[0], [ opts.output ] as any, 'should make the correct directory');
  t.true(stubRun.calledOnce, 'run should be called once');
  t.true(stubPrepare.calledOnce, 'prepare should be called once');
  t.true(stubDownload.calledOnce, 'downloadWithProgress should be called once');
  t.deepEqual(stubDownload.args[0], [ mockUrl, tmpFilePath ] as any, 'should download the correct file');
});

test.serial('train: fetch with invalid poptocol', async (t) => {
  const mockUrl = 'ftp://a.b.c/path/to/filename.json';
  const opts = {
    output: path.resolve('/tmp'),
    nocache: true,
    mirror: '',
    debug: false,
    npmClient: 'npm',
    dev: false
  };
  const stubMkdirp = sinon.stub(fs, 'mkdirp').resolves();
  const mockFail = sinon.stub(utils.logger, 'fail').resolves();
  await pipcook.train(mockUrl, opts),
  t.true(mockFail.calledOnce, 'fail should be called once');
  t.deepEqual(mockFail.args[0], [ 'run pipeline error: protocol \'ftp:\' not supported' ], 'should fail with correct message');
  t.true(stubMkdirp.calledOnce, 'mkdirp should be called once');
  t.deepEqual(stubMkdirp.args[0], [ opts.output ] as any, 'should make the correct directory');
});

test.serial('train: fetch with invalid poptocol debug', async (t) => {
  const mockUrl = 'ftp://a.b.c/path/to/filename.json';
  const opts = {
    output: path.resolve('/tmp'),
    nocache: true,
    mirror: '',
    debug: true,
    npmClient: 'npm',
    dev: false
  };
  const stubMkdirp = sinon.stub(fs, 'mkdirp').resolves();
  const mockFail = sinon.stub(utils.logger, 'fail').resolves();
  await pipcook.train(mockUrl, opts);
  t.true(mockFail.calledOnce, 'fail should be called once');
  t.true(
    mockFail.args[0][0].includes('protocol \'ftp:\' not supported') &&
    mockFail.args[0][0].includes('at ')
    , 'should fail with correct message');
  t.true(stubMkdirp.calledOnce, 'mkdirp should be called once');
  t.deepEqual(stubMkdirp.args[0], [ opts.output ] as any, 'should make the correct directory');
});

test.serial('train: fetch with url invalid extname', async (t) => {
  const mockUrl = 'http://a.b.c/path/to/filename.html';
  const opts = {
    output: path.resolve('/tmp'),
    nocache: true,
    mirror: '',
    debug: false,
    npmClient: 'npm',
    dev: false
  };
  const tmpFilePath = path.join(path.resolve(opts.output), 'filename.html');
  const mockPipelineConfig = { mock: 'value' };
  const stubReadJson = sinon.stub(fs, 'readJson').resolves(mockPipelineConfig);
  const stubMkdirp = sinon.stub(fs, 'mkdirp').resolves();
  const stubDownload = sinon.stub(utils, 'downloadWithProgress').resolves();
  const stubRun = sinon.stub(StandaloneRuntime.prototype, 'train').resolves();
  const stubWarn = sinon.stub(console, 'warn').returns();
  const stubPrepare = sinon.stub(StandaloneRuntime.prototype, 'prepare').resolves();
  await pipcook.train(mockUrl, opts);
  t.true(stubReadJson.calledOnce, 'readJson should be called once');
  t.deepEqual(stubReadJson.args[0], [ tmpFilePath ] as any, 'should read the correct file');
  t.true(stubMkdirp.calledOnce, 'mkdirp should be called once');
  t.deepEqual(stubMkdirp.args[0], [ opts.output ] as any, 'should make the correct directory');
  t.true(stubRun.calledOnce, 'run should be called once');
  t.true(stubPrepare.calledOnce, 'prepare should be called once');
  t.true(stubDownload.calledOnce, 'downloadWithProgress should be called once');
  t.deepEqual(stubDownload.args[0], [ mockUrl, tmpFilePath ] as any, 'should download the correct file');
  t.true(stubWarn.calledOnce, 'should call console.warn once');
  t.deepEqual(stubWarn.args[0], [ 'pipeline configuration file should be a json file' ], 'should console.warn with correct message');
});

test.serial('predict: file in workspace, uri input', async (t) => {
  const mockUrl = '/a.b.c/path/to/filename.json';
  const opts = {
    uri: path.resolve('/path/to/input-file'),
    output: path.resolve('/tmp'),
    nocache: true,
    mirror: '',
    debug: false,
    dev: false
  };
  const stubReadFile = sinon.stub(fs, 'readFile').resolves(Buffer.from([]));
  const stubFail = sinon.stub(utils.logger, 'fail').returns();
  const stubMakeDataset = sinon.stub(utils.PredictDataset, 'makePredictDataset').resolves({ mockDataset: '' });
  const stubProcessData = sinon.stub(utils.PostPredict, 'processData').resolves();
  const stubPredict = sinon.stub();
  const stubPreparePredict = sinon.stub(pipcook, 'preparePredict').resolves({
    runtime: { predict: stubPredict } as any,
    pipelineMeta: { type: PipelineType.ImageClassification } as any,
    workspace: path.resolve('/path/to/workspace'),
    isNewWorkspace: false
  });
  await pipcook.predict(mockUrl, opts);
  t.true(stubReadFile.calledOnce);
  t.is(stubReadFile.args[0][0], opts.uri);
  t.true(stubPreparePredict.calledOnce);
  t.true(stubPredict.calledOnce, 'run should be called once');
  t.false(stubFail.called, 'should not call logger.fail');
  t.true(stubMakeDataset.calledOnce);
  t.true(stubProcessData.calledOnce);
});

test.serial('predict: zip, string input', async (t) => {
  const mockUrl = '/a.b.c/path/to/filename.zip';
  const opts = {
    str: 'test-input',
    output: path.resolve('/tmp'),
    nocache: true,
    mirror: '',
    debug: false,
    dev: false
  };
  const stubFail = sinon.stub(utils.logger, 'fail').returns();
  const stubWarn = sinon.stub(utils.logger, 'warn').returns();
  const stubMakeDataset = sinon.stub(utils.PredictDataset, 'makePredictDataset').resolves({ mockDataset: '' });
  const stubProcessData = sinon.stub(utils.PostPredict, 'processData').resolves();
  const stubPredict = sinon.stub();
  const stubPreparePredict = sinon.stub(pipcook, 'preparePredict').resolves({
    runtime: { predict: stubPredict } as any,
    pipelineMeta: { type: PipelineType.ImageClassification } as any,
    workspace: path.resolve('/path/to/workspace'),
    isNewWorkspace: true
  });
  await pipcook.predict(mockUrl, opts);
  t.true(stubPreparePredict.calledOnce);
  t.true(stubPredict.calledOnce, 'run should be called once');
  t.true(stubWarn.called, 'should call console.warn');
  t.is(stubWarn.args[0][0], `The workspace has been created, and you should type \'pipcook predict ${path.resolve('/path/to/workspace')} -s/-t <data>\' to predict next time.`);
  t.false(stubFail.called, 'should not call logger.fail');
  t.true(stubMakeDataset.calledOnce);
  t.true(stubProcessData.calledOnce);
});

test.serial('predict: zip, string input, can not make dataset', async (t) => {
  const mockUrl = '/a.b.c/path/to/filename.zip';
  const opts = {
    str: 'test-input',
    output: path.resolve('/tmp'),
    nocache: true,
    mirror: '',
    debug: true,
    dev: false
  };
  const stubFail = sinon.stub(utils.logger, 'fail').returns();
  const stubWarn = sinon.stub(utils.logger, 'warn').returns();
  const stubMakeDataset = sinon.stub(utils.PredictDataset, 'makePredictDataset').resolves(undefined);
  const stubProcessData = sinon.stub(utils.PostPredict, 'processData');
  const stubPredict = sinon.stub();
  const stubPreparePredict = sinon.stub(pipcook, 'preparePredict').resolves({
    runtime: { predict: stubPredict } as any,
    pipelineMeta: { type: PipelineType.ImageClassification } as any,
    workspace: path.resolve('/path/to/workspace'),
    isNewWorkspace: false
  });
  await pipcook.predict(mockUrl, opts);
  t.true(stubPreparePredict.calledOnce);
  t.false(stubPredict.called, 'run should not be called');
  t.false(stubWarn.called, 'should not call console.warn');
  t.true(stubFail.called, 'should call logger.fail once');
  t.true(stubFail.args[0][0].indexOf(`invalid pipeline type: ${PipelineType.ImageClassification}`) > 0);
  t.true(stubMakeDataset.calledOnce);
  t.false(stubProcessData.called);
});

test.serial('predict: invalid input', async (t) => {
  const mockUrl = '/a.b.c/path/to/filename.json';
  const opts: any = {
    uri: undefined,
    output: path.resolve('/tmp'),
    nocache: true,
    mirror: '',
    debug: false,
    dev: false
  };
  const stubFail = sinon.stub(utils.logger, 'fail').returns();
  await pipcook.predict(mockUrl, opts);
  t.true(stubFail.calledOnce);
  t.is(stubFail.args[0][0], 'predict error: Str or uri should be specified, see `pipcook predict --help` for more information.');
});

test.serial.cb('serve: new workspace', (t) => {
  const mockUrl = '/a.b.c/path/to/workspace';
  const opts: any = {
    uri: undefined,
    output: path.resolve('/tmp'),
    nocache: true,
    mirror: '',
    debug: false,
    dev: false,
    port: 1234
  };
  const stubFail = sinon.stub(utils.logger, 'fail').returns();
  const stubPredict = sinon.stub();
  const mockDataset = {};
  const stubMakeDataset = sinon.stub(utils.PredictDataset, 'makePredictDataset').resolves(mockDataset as any);
  const stubPreparePredict = sinon.stub(pipcook, 'preparePredict').resolves({
    runtime: { predict: stubPredict } as any,
    pipelineMeta: { type: PipelineType.ImageClassification } as any,
    workspace: path.resolve('/path/to/workspace'),
    isNewWorkspace: true
  });
  const mockBuffers = [ Buffer.from('s0'), Buffer.from('s1') ];
  sinon.stub(utils.ServePredict, 'serve').callsFake(
    async (port: number, pipelineType: PipelineType, callback: utils.ServePredict.PredictCallBack) => {
      t.is(port, 1234);
      t.is(pipelineType, PipelineType.ImageClassification);
      process.nextTick(async () => {
        await callback(mockBuffers);
        t.true(stubMakeDataset.calledOnce);
        t.deepEqual(stubMakeDataset.args[0], [ mockBuffers, PipelineType.ImageClassification ] as any);
        t.true(stubPreparePredict.calledOnce);
        t.false(stubFail.calledOnce);
        t.true(stubPredict.calledOnce);
        t.deepEqual(stubPredict.args[0], [ mockDataset ]);
        t.end();
      });
    }
  );
  pipcook.serve(mockUrl, opts);
});

test.serial('preparePredict from workspace', async (t) => {
  const mockOptions = {
    nocache: true,
    mirror: '',
    debug: false,
    dev: false
  };
  const stubStat = sinon.stub(fs, 'stat').resolves({
    isDirectory: () => true
  } as any);
  const mockMeta: any = { mock: 'value' };
  const stubReadJson = sinon.stub(fs, 'readJson').resolves(mockMeta);
  const stubRuntimePrepare = sinon.stub(StandaloneRuntime.prototype, 'prepare').resolves();
  const { pipelineMeta, workspace, isNewWorkspace } =
    await pipcook.preparePredict('/path/to/workspace', mockOptions);
  t.is(workspace, path.resolve('/path/to/workspace'));
  t.is(isNewWorkspace, false);
  t.deepEqual(pipelineMeta, mockMeta);
  t.true(stubReadJson.calledOnce);
  t.true(stubStat.calledOnce);
  t.true(stubRuntimePrepare.calledOnce);
  t.is(stubRuntimePrepare.args[0][0], false);
});

test.serial('preparePredict from invalid path', async (t) => {
  const mockOptions = {
    nocache: true,
    mirror: '',
    debug: false,
    dev: false
  };
  const stubStat = sinon.stub(fs, 'stat').resolves({
    isDirectory: () => false
  } as any);
  await t.throwsAsync(
    pipcook.preparePredict('/path/to/invalid-file.js', mockOptions),
    { message: '\'/path/to/invalid-file.js\' is not a valid workspace or artifact.' }
  );
  t.true(stubStat.called);
});

test.serial('preparePredict from pipeline file', async (t) => {
  const mockOptions = {
    nocache: true,
    mirror: '',
    debug: false,
    dev: false
  };
  const stubStat = sinon.stub(fs, 'stat').resolves({
    isDirectory: () => false
  } as any);
  const mockMeta: any = { mock: 'value' };
  const stubReadJson = sinon.stub(fs, 'readJson').resolves(mockMeta);
  const stubRuntimePrepare = sinon.stub(StandaloneRuntime.prototype, 'prepare').resolves();
  const { pipelineMeta, workspace, isNewWorkspace } =
    await pipcook.preparePredict('/path/to/workspace/pipeline-file.json', mockOptions);
  t.is(workspace, path.resolve('/path/to/workspace'));
  t.is(isNewWorkspace, false);
  t.deepEqual(pipelineMeta, mockMeta);
  t.true(stubReadJson.calledOnce);
  t.true(stubStat.calledOnce);
  t.true(stubRuntimePrepare.calledOnce);
  t.is(stubRuntimePrepare.args[0][0], false);
});

test.serial('preparePredict from artifact zip in local', async (t) => {
  const mockOptions = {
    nocache: true,
    mirror: '',
    debug: false,
    dev: false
  };
  const stubStat = sinon.stub(fs, 'stat').resolves({
    isDirectory: () => false
  } as any);
  const mockMeta: any = { mock: 'value' };
  const stubReadJson = sinon.stub(fs, 'readJson').resolves(mockMeta);
  const stubRuntimePrepare = sinon.stub(StandaloneRuntime.prototype, 'prepare').resolves();
  const stubMakeWorkspace = sinon.stub(utils, 'makeWorkspace').resolves(path.resolve('/new/workspace'));
  const stubUnZipData = sinon.stub(utils, 'unZipData').resolves();
  const { pipelineMeta, workspace, isNewWorkspace } =
    await pipcook.preparePredict('/path/to/artifact.zip', mockOptions);
  t.is(path.resolve('/new/workspace'), workspace);
  t.true(stubUnZipData.calledOnce);
  t.is(isNewWorkspace, true);
  t.deepEqual(pipelineMeta, mockMeta);
  t.true(stubReadJson.calledOnce);
  t.true(stubMakeWorkspace.calledOnce);
  t.true(stubStat.calledOnce);
  t.true(stubRuntimePrepare.calledOnce);
  t.is(stubRuntimePrepare.args[0][0], false);
});

test.serial('preparePredict from unkown protocal url', async (t) => {
  const mockOptions = {
    nocache: true,
    mirror: '',
    debug: false,
    dev: false
  };
  await t.throwsAsync(pipcook.preparePredict('ftp://path/to/artifact.zip', mockOptions), { message: 'protocol \'ftp:\' not supported when predict' });
});

async function remoteArtifact(t: any, url: string) {
  const mockOptions = {
    nocache: true,
    mirror: '',
    debug: false,
    dev: false
  };
  const mockMeta: any = { mock: 'value' };
  const stubReadJson = sinon.stub(fs, 'readJson').resolves(mockMeta);
  const stubRuntimePrepare = sinon.stub(StandaloneRuntime.prototype, 'prepare').resolves();
  const stubMakeWorkspace = sinon.stub(utils, 'makeWorkspace').resolves(path.resolve('/new/workspace'));
  const stubDownloadAndExtractTo = sinon.stub(utils, 'downloadAndExtractTo').resolves();
  const { pipelineMeta, workspace, isNewWorkspace } =
    await pipcook.preparePredict(url, mockOptions);
  t.is(path.resolve('/new/workspace'), workspace);
  t.true(stubDownloadAndExtractTo.calledOnce);
  t.is(isNewWorkspace, true);
  t.deepEqual(pipelineMeta, mockMeta);
  t.true(stubReadJson.calledOnce);
  t.true(stubMakeWorkspace.calledOnce);
  t.true(stubRuntimePrepare.calledOnce);
  t.is(stubRuntimePrepare.args[0][0], false);
}

test.serial('preparePredict from remote artifact zip with https protocol', async (t) => {
  await remoteArtifact(t, 'https://host/path/to/artifact.zip');
});

test.serial('preparePredict from remote artifact zip with http protocol', async (t) => {
  await remoteArtifact(t, 'http://host/path/to/artifact.zip');
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
