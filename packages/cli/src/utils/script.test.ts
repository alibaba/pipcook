import test from 'ava';
import * as sinon from 'sinon';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ScriptType, PipelineMeta } from '@pipcook/costa';
import * as constants from '../constants';
import * as script from './script';
import * as cache from './cache';

test.serial.afterEach(() => sinon.restore());

test('download script with http protocol', async (t) => {
  const localPath = process.cwd();
  const url = 'http://mockUrl.com/a.js';
  const enableCache = true;
  const stubFetch = sinon.stub(cache, 'fetchWithCache').resolves();
  await script.downloadScript(localPath, 1, url, ScriptType.Model, enableCache);
  t.true(stubFetch.calledOnce, 'fetchWithCache should be called once');
  t.deepEqual(
    stubFetch.args[0],
    [ constants.PIPCOOK_SCRIPT_PATH, url, `${localPath}/1-a.js`, enableCache ],
    'fetchWithCache should called with currect args'
  );
});

test.serial('download script with https protocol', async (t) => {
  const localPath = process.cwd();
  const url = 'https://mockUrl.com/a.js';
  const enableCache = true;
  const stubFetch = sinon.stub(cache, 'fetchWithCache').resolves();
  await script.downloadScript(localPath, 1, url, ScriptType.Model, enableCache);
  t.true(stubFetch.calledOnce, 'fetchWithCache should be called once');
  t.deepEqual(
    stubFetch.args[0],
    [ constants.PIPCOOK_SCRIPT_PATH, url, `${localPath}/1-a.js`, enableCache ],
    'fetchWithCache should called with currect args'
  );
});

test.serial('download script with file protocol', async (t) => {
  const localPath = process.cwd();
  const url = 'file:///data/a.js';
  const enableCache = true;
  const stubCopy = sinon.stub(fs, 'copy').resolves();
  const scriptDesc = await script.downloadScript(localPath, 1, url, ScriptType.Model, enableCache);
  t.deepEqual(scriptDesc, {
    name: 'a.js',
    path: '/data/a.js',
    type: ScriptType.Model,
    query: {}
  }, 'should return correct script');
  t.false(stubCopy.called, 'fs.copy should not be called');
});

test.serial('download script with relative path file protocol', async (t) => {
  const localPath = process.cwd();
  const url = 'file:data/a.js';
  const enableCache = true;
  const stubCopy = sinon.stub(fs, 'copy').resolves();
  const scriptDesc = await script.downloadScript(localPath, 1, url, ScriptType.Model, enableCache);
  t.deepEqual(scriptDesc, {
    name: 'a.js',
    path: path.join(process.cwd(), 'data/a.js'),
    type: ScriptType.Model,
    query: {}
  }, 'should return correct script');
  t.false(stubCopy.called, 'fs.copy should not be called');
});

test.serial('download script with file protocol and query', async (t) => {
  const localPath = process.cwd();
  const url = 'file:///data/a.js?a=1&b=http://a.b.c';
  const enableCache = true;
  const stubCopy = sinon.stub(fs, 'copy').resolves();
  const scriptDesc = await script.downloadScript(localPath, 1, url, ScriptType.Model, enableCache);
  t.deepEqual(scriptDesc, {
    name: 'a.js',
    path: '/data/a.js',
    type: ScriptType.Model,
    query: {
      a: '1',
      b: 'http://a.b.c'
    }
  }, 'should return correct script');
  t.false(stubCopy.called, 'fs.copy should not be called');
});

async function runPrepare(t: any, enableCache: boolean, withDataflow: boolean) {
  const pipelineMeta: PipelineMeta = {
    'specVersion': '2.0',
    'dataSource': 'https://cdn.jsdelivr.net/gh/imgcook/pipcook-plugin-image-classification-collector@2.0/build/script.js',
    'model': 'https://cdn.jsdelivr.net/gh/imgcook/pipcook-plugin-tfjs-mobilenet-model@2.0/build/script.js',
    'dataflow': [
      'https://cdn.jsdelivr.net/gh/imgcook/pipcook-plugin-process-tfjs-image-classification@2.0/build/script.js?size=224&size=224'
    ],
    'artifacts': [
      {
        'processor': 'pipcook-ali-oss-uploader@0.0.3',
        'target': 'oss://pipcook-cloud/model/mobile2.0'
      }
    ],
    'options': {
      'framework': 'http://pipcook.oss-cn-hangzhou.aliyuncs.com/mirrors/tf-node-gpu-linux.zip',
      'train': {
        'epochs': 1,
        'validationRequired': true
      },
      'url': 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/imageclass-test.zip'
    }
  };
  if (!withDataflow) {
    pipelineMeta.dataflow = [];
  }
  const dir = '/tmp';
  const mockScript: any = { mock: 'value' };
  const stubDownloadScript = sinon.stub(script, 'downloadScript').resolves(mockScript);
  const scriptConfig = await script.prepareScript(pipelineMeta, dir, enableCache);
  if (!withDataflow) {
    t.true(stubDownloadScript.calledTwice, 'downloadScript should be called twice');
    t.deepEqual(stubDownloadScript.args[0], [ dir, 0, pipelineMeta.dataSource, ScriptType.DataSource, enableCache ], 'downloadScript should be called with datasource');
    t.deepEqual(stubDownloadScript.args[1], [ dir, 1, pipelineMeta.model, ScriptType.Model, enableCache ], 'downloadScript should be called with model');
    t.deepEqual(scriptConfig, {
      dataSource: mockScript,
      dataflow: null,
      model: mockScript
    }, 'script config should be equal');
  } else {
    t.true(stubDownloadScript.calledThrice, 'downloadScript should be called thrice');
    t.deepEqual(stubDownloadScript.args[0], [ dir, 0, pipelineMeta.dataSource, ScriptType.DataSource, enableCache ], 'downloadScript should be called with datasource');
    t.deepEqual(stubDownloadScript.args[1], [ dir, 1, pipelineMeta.dataflow[0], ScriptType.Dataflow, enableCache ], 'downloadScript should be called with dataflow');
    t.deepEqual(stubDownloadScript.args[2], [ dir, 2, pipelineMeta.model, ScriptType.Model, enableCache ], 'downloadScript should be called with model');
    t.deepEqual(scriptConfig, {
      dataSource: mockScript,
      dataflow: [ mockScript ],
      model: mockScript
    }, 'script config should be equal');
  }
}

test.serial('prepare script', async (t) => {
  await runPrepare(t, true, true);
});

test.serial('prepare script without dataflow', async (t) => {
  await runPrepare(t, false, false);
});
