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

test.serial('should start the plugin', async (t) => {
  const args = [ { name: '@pipcook/mock-plugin' }, 1, 2, 3 ];
  const runnable = new PluginRunnable('componentDir', 'pluginDir', process, 'mockId');
  const stubLoad = sinon.stub().resolves();
  const stubStart = sinon.stub().resolves(null);
  const stubEntry = { load: stubLoad, start: stubStart };
  (runnable as any).ipcProxy = stubEntry;
  (runnable as any).state = 'idle';
  sinon.stub(fs, 'ensureDir').resolves();
  sinon.stub(fs, 'ensureSymlink').resolves();
  t.is(await runnable.start(args[0] as any, args[1], args[2], args[3]), null, 'start result should be null');
  t.true(stubStart.calledOnce, 'start should be called once');
  t.deepEqual(stubStart.args[0], args, 'start args should be [ 1, 2, 3 ]');
  t.true(stubLoad.calledOnce, 'load should be called once');
});

test('should start the plugin but runnable not idle', async (t) => {
  const runnable = new PluginRunnable('componentDir', 'pluginDir', process, 'mockId');
  (runnable as any).state = 'busy';
  await t.throwsAsync(runnable.start({} as any), {
    instanceOf: TypeError, message: 'the runnable "mockId" is busy or not ready now'
  });
});

test('should destroy but not connected', async (t) => {
  const runnable = new PluginRunnable('componentDir', 'pluginDir', process, 'mockId');
  (runnable as any).handle = { connected: false };
  const stubDestroy = sinon.stub().resolves(null);
  const stubEntry = { destroy: stubDestroy };
  (runnable as any).ipcProxy = stubEntry;
  await runnable.destroy();
  t.false(stubDestroy.called, 'ipc destroy should not be called');
});

test('should destroy', async (t) => {
  const runnable = new PluginRunnable('componentDir', 'pluginDir', process, 'mockId');
  (runnable as any).handle = { connected: true };
  const stubDestroy = sinon.stub().resolves(null);
  const stubEntry = { destroy: stubDestroy };
  (runnable as any).ipcProxy = stubEntry;
  await runnable.destroy();
  t.true(stubDestroy.calledOnce, 'ipc destroy should be called once');
});

test('should destroy but ipc error', async (t) => {
  const runnable = new PluginRunnable('componentDir', 'pluginDir', process, 'mockId');
  const stubKill = sinon.stub().returns(null);
  (runnable as any).handle = { connected: true, kill: stubKill };
  const stubDestroy = sinon.stub().rejects(new Error('ipc error'));
  const stubEntry = { destroy: stubDestroy };
  (runnable as any).ipcProxy = stubEntry;
  await runnable.destroy();
  t.true(stubDestroy.calledOnce, 'ipc destroy should be called once');
  t.true(stubKill.calledOnce, 'kill should be called once');
});
