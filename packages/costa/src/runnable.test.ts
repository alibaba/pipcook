import test from 'ava';
import * as path from 'path';
import * as fs from 'fs-extra';
import { PluginRunnable } from './runnable';
import * as ChildProcess from 'child_process';
import * as utils from './utils';
import * as IPCProxy from './ipc-proxy';
import sinon = require('sinon');

test.serial.afterEach(() => sinon.restore());

test('should constrcute the runnable', (t) => {
  const runnable = new PluginRunnable('componentDir', 'pluginDir', process, 'mockId');
  t.is(runnable.workingDir, path.join('componentDir', 'mockId'), 'working directory is not correct');
  t.is((runnable as any).logger, process, 'logger not equal');
});

test('should constrcute the runnable with default logger and id', (t) => {
  const runnable = new PluginRunnable('componentDir', 'pluginDir');
  t.true(runnable.workingDir.startsWith('componentDir'), 'working directory is not correct');
  t.is((runnable as any).logger, process, 'logger not equal');
});

test.serial('should bootstrap the runnable', async (t) => {
  const runnable = new PluginRunnable('componentDir', 'pluginDir', process, 'mockId');
  const stubChild = { stdout: 'mock stdout', stderr: 'mock stderr' };
  const stubHandShake = sinon.stub().resolves('mockId');
  const stubEntry = { handshake: stubHandShake };
  sinon.stub(ChildProcess, 'fork').returns(stubChild as any);
  sinon.stub(utils, 'pipeLog').returns();
  sinon.stub(IPCProxy, 'setup').returns(stubEntry as any);
  sinon.stub(fs, 'ensureDir').resolves();
  await runnable.bootstrap({ pluginLoadNotRespondingTimeout: 1 });
  t.is(stubHandShake.callCount, 1, 'should call handshake once');
});

test.serial('bootstrap the runnable but handshake error', async (t) => {
  const runnable = new PluginRunnable('componentDir', 'pluginDir', process, 'mockId');
  const stubChild = { stdout: 'mock stdout', stderr: 'mock stderr' };
  const stubHandShake = sinon.stub().resolves(undefined);
  const stubEntry = { handshake: stubHandShake };
  sinon.stub(ChildProcess, 'fork').returns(stubChild as any);
  sinon.stub(utils, 'pipeLog').returns();
  sinon.stub(IPCProxy, 'setup').returns(stubEntry as any);
  sinon.stub(fs, 'ensureDir').resolves();
  await t.throwsAsync(runnable.bootstrap({ pluginLoadNotRespondingTimeout: 1 }),
    { instanceOf: TypeError, message: 'created runnable "mockId" failed.' }
  );
  t.is(stubHandShake.callCount, 1, 'should call handshake once');
});

test('should get value of the PluginResponse', async (t) => {
  const runnable = new PluginRunnable('componentDir', 'pluginDir', process, 'mockId');
  const mockResp = { id: 'mockRespId' };
  const mockResult = { id: 'mockResult' };
  const stubValueOf = sinon.stub().resolves(mockResult);
  (runnable as any).ipcProxy = { valueOf: stubValueOf };
  t.deepEqual(await runnable.valueOf(mockResp), mockResult);
});

test('should start the plugin', async (t) => {
  const runnable = new PluginRunnable('componentDir', 'pluginDir', process, 'mockId');
  t.deepEqual(await runnable.start();
});
