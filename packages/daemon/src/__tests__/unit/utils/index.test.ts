import test from 'ava';
import * as core from '@pipcook/pipcook-core';
import * as utils from '../../../utils';
import * as sinon from 'sinon';
import * as fs from 'fs-extra';
import { join } from 'path';
import * as request from 'request-promise';
const result: any = {
  // name: undefined,
  dataCollect: '@pipcook/plugins-csv-data-collect',
  dataCollectParams: { "url": "http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textClassification.zip" },
  dataAccess: '@pipcook/plugins-csv-data-access',
  dataAccessParams: { "labelColumn": "output" },
  // dataProcess: {},
  // dataProcessParams: {},
  // datasetProcess: {},
  // datasetProcessParams: {},
  modelDefine: '@pipcook/plugins-bayesian-model-define',
  // modelDefineParams: {},
  // modelLoad: {},
  // modelLoadParams: {},
  modelTrain: '@pipcook/plugins-bayesian-model-train',
  // modelTrainParams: {},
  modelEvaluate: '@pipcook/plugins-bayesian-model-evaluate',
  // modelEvaluateParams: {}
};

const mockPipelineConfig = {
  plugins: {
    dataCollect: {
      package: '@pipcook/dataCollect'
    }
  }
};

// test the app service
test.serial.afterEach(() => {
  sinon.restore();
});

test.serial('should parse config from json and generate id', async (t) => {
  const mockGenerateId = sinon.stub(core, 'generateId').returns('mockId');
  const configJson = fs.readJSON(join(__dirname, '../../../../../../example/pipelines/text-bayes-classification.json'));
  t.deepEqual((await utils.parseConfig(configJson as any)).toJSON(), { id: 'mockId', ...result }, 'result check');
  t.true(mockGenerateId.calledOnce, 'generateId check');
});

test.serial('should parse config from local file and without id', async (t) => {
  sinon.stub(core, 'generateId').returns('mockId');
  const filePath = `file://${join(__dirname, '../../../../../../example/pipelines/text-bayes-classification.json')}`;
  t.deepEqual((await utils.parseConfig(filePath)).toJSON(), { id: 'mockId', ...result }, 'result check');
});

test('parse config from ftp file', async (t) => {
  const filePath = 'ftp://a.b.com';
  let catched = false;
  try {
    await utils.parseConfig(filePath);
  } catch (err) {
    catched = true;
    t.is(err.message, 'protocol ftp: is not supported');
  }
  t.true(catched, 'error check');
});

test('parse config from invalid path', async (t) => {
  const filePath = './config.json';
  let catched = false;
  try {
    await utils.parseConfig(filePath);
  } catch (err) {
    catched = true;
    t.is(err.message, 'config URI is not supported')
  }
  t.true(catched, 'error check')
});

test.serial('load config from http', async (t) => {
  const mockUrl = 'http://a.b.c';
  let called = false;
  sinon.stub(request, 'get').callsFake((params) => {
    t.is(params, mockUrl as any);
    called = true;
    return Promise.resolve(JSON.stringify(mockPipelineConfig)) as any;
  });
  const configObj = await utils.loadConfig(mockUrl);
  t.deepEqual(configObj, JSON.parse(JSON.stringify(mockPipelineConfig)), 'config object check');
  t.true(called, 'function call check');
});

test.serial('load config from http but absolute path found', async (t) => {
  const mockUrl = 'http://a.b.c';
  let mockConfig = { ...mockPipelineConfig };
  mockConfig.plugins.dataCollect.package = '/root/plugin';
  const mockGet = sinon.stub(request, 'get').callsFake((params) => {
    t.is(params, mockUrl as any);
    return Promise.resolve(JSON.stringify(mockConfig)) as any;
  });
  await t.throwsAsync(utils.loadConfig(mockUrl), {
    instanceOf: TypeError,
    message: 'local path is invalid for plugin package: /root/plugin'
  });
  t.true(mockGet.called, 'function call check');
});

test.serial('load config from http but relative path found', async (t) => {
  const mockUrl = 'http://a.b.c';
  let mockConfig = { ...mockPipelineConfig };
  mockConfig.plugins.dataCollect.package = './plugin';
  const mockGet = sinon.stub(request, 'get').callsFake((params) => {
    t.is(params, mockUrl as any);
    return Promise.resolve(JSON.stringify(mockConfig)) as any;
  });
  await t.throwsAsync(() => utils.loadConfig(mockUrl), {
    instanceOf: TypeError,
    message: 'local path is invalid for plugin package: ./plugin'
  });
  t.true(mockGet.called, 'function call check');
});

test.serial('should copy the file successfully', async (t) => {
  const src = __filename;
  const dest = join(__dirname, 'dest.ts');
  const copyStub = sinon.stub(fs, 'copyFile');
  const chmodStub = sinon.stub(fs, 'chmod');
  await t.notThrowsAsync(utils.copyDir(src, dest), 'copyDir should not be rejected');
  t.true(copyStub.calledOnce, 'copyFile should be called only once');
  t.true(chmodStub.calledOnce, 'chmod should be called only once');
});

test.serial('should copy the symlink successfully', async (t) => {
  const dest = join(__dirname, 'dest');
  const symStub = sinon.stub(fs, 'symlink').resolves();
  sinon.stub(fs, 'readlink').resolves();
  sinon.stub(fs, 'lstat').resolves({
    isSymbolicLink: () => true,
    isDirectory: () => false,
    isFile: () => false,
    isBlockDevice: () => false,
    isCharacterDevice: () => false
  } as any);
  await t.notThrowsAsync(utils.copyDir(join(__dirname, 'src'), dest), 'copyDir should not be rejected');
  t.true(symStub.calledOnce, 'symlink should be called only once');
});
