import * as core from '@pipcook/pipcook-core';
import { assert } from 'midway-mock/bootstrap';
import * as helper from '../../src/utils';
import * as sinon from 'sinon';
import * as fs from 'fs-extra';
import { join } from 'path';

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
});
