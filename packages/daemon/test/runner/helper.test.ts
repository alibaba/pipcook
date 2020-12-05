import * as core from '@pipcook/pipcook-core';
import { assert } from 'midway-mock/bootstrap';
import * as assertNode from 'assert';
import * as helper from '../../src/utils';
import * as sinon from 'sinon';
import * as fs from 'fs-extra';
import { join } from 'path';
import * as request from 'request-promise';

const result: any = {
  name: undefined,
  dataCollect: '@pipcook/plugins-csv-data-collect',
  dataCollectParams: '{"url":"http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textClassification.zip"}',
  dataAccess: '@pipcook/plugins-csv-data-access',
  dataAccessParams: '{"labelColumn":"output"}',
  dataProcess: undefined,
  dataProcessParams: '{}',
  datasetProcess: undefined,
  datasetProcessParams: '{}',
  modelDefine: '@pipcook/plugins-bayesian-model-define',
  modelDefineParams: '{}',
  modelLoad: undefined,
  modelLoadParams: '{}',
  modelTrain: '@pipcook/plugins-bayesian-model-train',
  modelTrainParams: '{}',
  modelEvaluate: '@pipcook/plugins-bayesian-model-evaluate',
  modelEvaluateParams: '{}'
};

const mockPipelineConfig = {
  plugins: {
    dataCollect: {
      package: '@pipcook/dataCollect'
    }
  }
};

describe('test the app service', () => {
  afterEach(() => {
    sinon.restore();
  })
  it('#should parse config from json and generate id', async () => {
    const mockGenerateId = sinon.stub(core, 'generateId').returns('mockId');
    const configJson = fs.readJSON(join(__dirname, '../../../../example/pipelines/text-bayes-classification.json'));
    assert.deepEqual(await helper.parseConfig(configJson as any), { id: 'mockId', ...result }, 'result check');
    assert.ok(mockGenerateId.calledOnce, 'generateId check');
  });
  it('#should parse config from local file and without id', async () => {
    const filePath = `file://${join(__dirname, '../../../../example/pipelines/text-bayes-classification.json')}`;
    assert.deepEqual(await helper.parseConfig(filePath, false), { id: undefined, ...result }, 'result check');
  });
  it('#parse config from ftp file', async () => {
    const filePath = 'ftp://a.b.com';
    let catched = false;
    try {
      await helper.parseConfig(filePath);
    } catch (err) {
      catched = true;
      assert.equal(err.message, 'protocol ftp: is not supported')
    }
    assert.ok(catched, 'error check')
  });
  it('#parse config from invalid path', async () => {
    const filePath = './config.json';
    let catched = false;
    try {
      await helper.parseConfig(filePath);
    } catch (err) {
      catched = true;
      assert.equal(err.message, 'config URI is not supported')
    }
    assert.ok(catched, 'error check')
  });
  it('#load config from http', async () => {
    const mockUrl = 'http://a.b.c';
    let called = false;
    sinon.stub(request, 'get').callsFake((params) => {
      assert.equal(params, mockUrl);
      called = true;
      return Promise.resolve(JSON.stringify(mockPipelineConfig)) as any;
    });
    const configObj = await helper.loadConfig(mockUrl);
    assert.deepEqual(configObj, JSON.parse(JSON.stringify(mockPipelineConfig)), 'config object check');
    assert.ok(called, 'function call check');
  });
  it('#load config from http but absolute path found', async () => {
    const mockUrl = 'http://a.b.c';
    let called = false, throwError = false;
    let mockConfig = { ...mockPipelineConfig };
    mockConfig.plugins.dataCollect.package = '/root/plugin';
    sinon.stub(request, 'get').callsFake((params) => {
      assert.equal(params, mockUrl);
      called = true;
      return Promise.resolve(JSON.stringify(mockConfig)) as any;
    });
    try {
      await helper.loadConfig(mockUrl);
    } catch (err) {
      throwError = true;
      assert.equal('local path is invalid for plugin package: /root/plugin', err.message);
    }
    assert.ok(called, 'function call check');
    assert.ok(throwError, 'error call check');
  });
  it('#load config from http but relative path found', async () => {
    const mockUrl = 'http://a.b.c';
    let called = false, throwError = false;
    let mockConfig = { ...mockPipelineConfig };
    mockConfig.plugins.dataCollect.package = './plugin';
    sinon.stub(request, 'get').callsFake((params) => {
      assert.equal(params, mockUrl);
      called = true;
      return Promise.resolve(JSON.stringify(mockConfig)) as any;
    });
    try {
      await helper.loadConfig(mockUrl);
    } catch (err) {
      throwError = true;
      assert.equal('local path is invalid for plugin package: ./plugin', err.message);
    }
    assert.ok(called, 'function call check');
    assert.ok(throwError, 'error call check');
  });
  it('#should copy the file successfully', async () => {
    const src = join(__dirname, 'helper.test.ts');
    const dest = join(__dirname, 'dest.ts');
    const copyStub = sinon.stub(fs, 'copyFile');
    const chmodStub = sinon.stub(fs, 'chmod');
    await assertNode.doesNotReject(async () => {
      await helper.copyDir(src, dest);
    }, 'copyDir should not be rejected');
    assert.ok(copyStub.calledOnce, 'copyFile should be called only once');
    assert.ok(chmodStub.calledOnce, 'chmod should be called only once');
  });
  it('#should copy the symlink successfully', async () => {
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
    await assertNode.doesNotReject(async () => {
      await helper.copyDir(join(__dirname, 'src'), dest);
    }, 'copyDir should not be rejected');
    assert.ok(symStub.calledOnce, 'symlink should be called only once');
  });
});
