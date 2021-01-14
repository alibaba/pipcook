import test from 'ava';
import * as core from '@pipcook/pipcook-core';
import * as utils from '../../../utils';
import { sinon } from '@loopback/testlab';
import * as fs from 'fs-extra';
import { join } from 'path';
import * as request from 'request-promise';
import * as ChildProcess from 'child_process';
import { mockFunctionFromGetter } from '../../__helpers__';

const result: any = {
  dataCollect: '@pipcook/plugins-csv-data-collect',
  dataCollectParams: { 'url': 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textClassification.zip' },
  dataAccess: '@pipcook/plugins-csv-data-access',
  dataAccessParams: { 'labelColumn': 'output' },
  modelDefine: '@pipcook/plugins-bayesian-model-define',
  modelTrain: '@pipcook/plugins-bayesian-model-train',
  modelEvaluate: '@pipcook/plugins-bayesian-model-evaluate'
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
  const mockGenerateId = mockFunctionFromGetter(core, 'generateId').returns('mockId');
  const configJson = fs.readJSON(join(__dirname, '../../../../../../example/pipelines/text-bayes-classification.json'));
  t.deepEqual((await utils.parseConfig(configJson as any)).toJSON(), { id: 'mockId', ...result }, 'result check');
  t.true(mockGenerateId.calledOnce, 'generateId check');
});

test.serial('should parse config from local file and without id', async (t) => {
  mockFunctionFromGetter(core, 'generateId').returns('mockId');
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
    t.is(err.message, 'config URI is not supported');
  }
  t.true(catched, 'error check');
});

test.serial('load config from http', async (t) => {
  const mockUrl = 'http://a.b.c';
  let called = false;
  sinon.stub(request, 'get').callsFake((params: string) => {
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
  const mockConfig = { ...mockPipelineConfig };
  mockConfig.plugins.dataCollect.package = '/root/plugin';
  const mockGet = sinon.stub(request, 'get').callsFake((params: string) => {
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
  const mockConfig = { ...mockPipelineConfig };
  mockConfig.plugins.dataCollect.package = './plugin';
  const mockGet = sinon.stub(request, 'get').callsFake((params: string) => {
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

test.serial('should copy the directory successfully', async (t) => {
  const src = '/src/';
  const dest = '/dest/';
  const copyStub = sinon.stub(fs, 'copyFile');
  const chmodStub = sinon.stub(fs, 'chmod');
  const lstatStub = sinon.stub(fs, 'lstat');
  lstatStub.onCall(0).resolves({
    isDirectory: () => true
  } as any);
  lstatStub.onCall(1).resolves({
    isDirectory: () => false,
    isFile: () => true,
    isCharacterDevice: () => true,
    isBlockDevice: () => true
  } as any);
  const ensureDirStub = sinon.stub(fs, 'ensureDir').resolves();
  const readdirStub = sinon.stub(fs, 'readdir').resolves([ 'a.jpg' ]);
  await t.notThrowsAsync(utils.copyDir(src, dest), 'copyDir should not be rejected');
  t.true(copyStub.calledOnce, 'copyFile should be called only once');
  t.true(chmodStub.calledOnce, 'chmod should be called only once');
  t.true(ensureDirStub.calledOnce, 'ensureDirStub should be called only once');
  t.true(readdirStub.calledOnce, 'ensureDirStub should be called only once');
  t.true(lstatStub.calledTwice, 'lstat should be called twice');
});

async function testExecAsync(t: any, isError: boolean): Promise<void> {
  const mockCmd = 'mock cmd';
  const mockOption = {};

  sinon.stub(ChildProcess, 'exec').callsFake(
    (
      command: string,
      options: ChildProcess.ExecOptions | null | undefined,
      callback?: (error: ChildProcess.ExecException | null, stdout: string, stderr: string) => void
    ): ChildProcess.ChildProcess => {
      t.is(command, mockCmd);
      t.deepEqual(options, mockOption);
      process.nextTick(() => {
        if (callback) {
          if (isError) {
            callback(new Error('mock Error'), 'stdout', 'stderr');
          } else {
            callback(null, 'stdout', 'stderr');
          }
        }
      });
      return {} as any;
    }
  );
  if (isError) {
    await t.throwsAsync(utils.execAsync(mockCmd, mockOption), { instanceOf: Error, message: 'mock Error' }, 'should throw error');
  } else {
    await t.notThrowsAsync(utils.execAsync(mockCmd, mockOption), 'should exec successfully');
  }
}

test.serial('exec command async', (t) => testExecAsync(t, false));
test.serial('exec command async but error thrown', (t) => testExecAsync(t, true));
