import test from 'ava';
import * as sinon from 'sinon';
import * as core from '@pipcook/pipcook-core';
import { Entry, ipcMethods, previousFlag } from './entry';
import * as utils from './utils';
const loadPlugin = require('./loaders');

test.serial.beforeEach(() => sinon.restore());

test('should constrcute Entry an setup it', (t) => {
  const stubOn = sinon.stub();
  const entry = new Entry({ on: stubOn } as any);
  entry.setup();
  t.true(stubOn.calledTwice, 'message and unhandledRejection event should be listened');
  t.is(stubOn.args[0][0], 'message', 'message event should be listen');
  t.is(stubOn.args[1][0], 'unhandledRejection', 'unhandledRejection event should be listen');
});

test('should throw rejection', (t) => {
  const entry = new Entry({} as NodeJS.Process);
  t.throws(
    () => entry.onUnhandledRejection(new Error('mock error')),
    { instanceOf: Error, message: 'mock error' },
    'should throw error'
  );
});

function testOnMessage(methodList: string[], isMethodError: boolean) {
  methodList.map((method) => {
    test(`should process ipc request for '${method}' with ${isMethodError ? '' : 'no '}error`, async (t) => {
      const entry = new Entry({} as NodeJS.Process);
      entry.handshaked = true;
      const stubMethod = sinon.stub();
      const methodError = new Error('mock method error');
      isMethodError ? stubMethod.rejects(methodError) : stubMethod.resolves({ data: 'mockData' });
      const stubSend = sinon.stub().returns(undefined);
      t.is(typeof (entry as any)[method], 'function', `method ${method} should be defined in Entry`);
      (entry as any)[method] = stubMethod;
      entry.send = stubSend;
      await entry.onMessage({ id: 0, method, args: [ 1, 2, 3 ] });
      t.true(stubSend.calledOnce, `send shoud be called once`);
      isMethodError
        ? t.deepEqual(stubSend.args[0], [ {
          id: 0, error: { message: methodError.message, stack: methodError.stack }, result: null
        } ], 'should send ipc result')
        : t.deepEqual(stubSend.args[0], [ { id: 0, error: null, result: { data: 'mockData' } } ], 'should send ipc result');
      t.true(stubMethod.calledOnce, `method '${method}' shoud be called once`);
      t.deepEqual(stubMethod.args[0], [ 1, 2, 3 ], `should method '${method}' called with args`);
    });
  });
}

testOnMessage(ipcMethods, false);
testOnMessage(ipcMethods, true);

ipcMethods.filter((method) => method !== 'handshake').map((method) => {
  test(`should process ipc request for '${method}' but not handshaked`, async (t) => {
    const entry = new Entry({} as NodeJS.Process);
    entry.handshaked = false;
    const stubMethod = sinon.stub();
    const stubSend = sinon.stub().returns(undefined);
    (entry as any)[method] = stubMethod;
    entry.send = stubSend;
    await entry.onMessage({ id: 0, method, args: [ 1, 2, 3 ] });
    t.true(stubSend.calledOnce, `send shoud be called once`);
    t.deepEqual(stubSend.args[0], [ {
      id: 0, error: { message: 'handshake is required.', stack: stubSend.args[0][0]?.error?.stack }, result: null
    } ], 'should send ipc result');
    t.false(stubMethod.called, `method '${method}' shoud not be called`);
  });
});

test('should process ipc request for \'handshake\' but not handshaked', async (t) => {
  const entry = new Entry({} as NodeJS.Process);
  entry.handshaked = false;
  const stubMethod = sinon.stub().returns('123');
  const stubSend = sinon.stub().returns(undefined);
  entry.handshake = stubMethod;
  entry.send = stubSend;
  await entry.onMessage({ id: 0, method: 'handshake', args: [ 1, 2, 3 ] });
  t.true(stubSend.calledOnce, `send should be called once`);
  t.deepEqual(stubSend.args[0], [ { id: 0, error: null, result: '123' } ], 'should send ipc result');
  t.true(stubMethod.calledOnce, `method 'handshake' shoud be called once`);
});

test('should call a nonexistent method', async (t) => {
  const entry = new Entry({} as NodeJS.Process);
  entry.handshaked = false;
  const stubSend = sinon.stub().returns(undefined);
  entry.send = stubSend;
  await entry.onMessage({ id: 0, method: 'someMethod', args: [ 1, 2, 3 ] });
  t.true(stubSend.calledOnce, `send should be called once`);
  t.is(stubSend.args[0][0].id, 0, 'id should be 0');
  t.is(stubSend.args[0][0].error?.message, 'no method found: someMethod', 'error message should mached');
  t.is(stubSend.args[0][0].result, null, 'result should be null');
});

test.serial('should send ipc response to parent', async (t) => {
  const stubConsoleError = sinon.stub(console, 'error');
  const stubSend = sinon.stub().returns(true);
  const entry = new Entry({ send: stubSend } as any);
  entry.send({ id: 0, error: null, result: '123' });
  t.true(stubSend.calledOnce, 'process.send should be called once');
  t.deepEqual(stubSend.args[0][0], { id: 0, error: null, result: '123' }, 'process.send should be called with args');
  t.is(typeof stubSend.args[0][1], 'function', 'process.send should be called with callback');
  stubSend.args[0][1]();
  t.false(stubConsoleError.called, 'console.error should not been called');
});

test.serial('should send ipc response to parent but fails with send result', async (t) => {
  const stubConsoleError = sinon.stub(console, 'error');
  const stubSend = sinon.stub().returns(false);
  const entry = new Entry({ send: stubSend } as any);
  entry.send({ id: 0, error: null, result: '123' });
  t.true(stubSend.calledOnce, 'process.send should be called once');
  t.deepEqual(stubSend.args[0][0], { id: 0, error: null, result: '123' }, 'process.send should be called with args');
  t.is(typeof stubSend.args[0][1], 'function', 'process.send should be called with callback');
  t.true(stubConsoleError.calledOnce, 'failed to send a message to parent process.');
});

test.serial('should send ipc response to parent but fails with callback', async (t) => {
  const stubConsoleError = sinon.stub(console, 'error');
  const stubSend = sinon.stub().returns(true);
  const entry = new Entry({ send: stubSend } as any);
  entry.send({ id: 0, error: null, result: '123' });
  t.true(stubSend.calledOnce, 'process.send should be called once');
  t.deepEqual(stubSend.args[0][0], { id: 0, error: null, result: '123' }, 'process.send should be called with args');
  t.is(typeof stubSend.args[0][1], 'function', 'process.send should be called with callback');
  stubSend.args[0][1](new Error('mock error'));
  t.true(stubConsoleError.calledOnce, 'console.error should be called once');
  t.is(stubConsoleError.args[0][0], 'failed to send a message to parent process with error: mock error');
});

test('should get value', (t) => {
  const entry = new Entry({} as NodeJS.Process);
  entry.previousResults = { '1': { n: 2 } };
  t.deepEqual(entry.valueOf({ m: 1 }), { m : 1 }, 'common object should not change');
  t.deepEqual(entry.valueOf({ id: '1', __flag__: previousFlag }), { n : 2 }, 'should get previous data');
});

test('should handshake', (t) => {
  const entry = new Entry({} as NodeJS.Process);
  entry.clientId = '';
  entry.handshaked = false;
  entry.handshake('mockId');
  t.is(entry.clientId, 'mockId', 'should set client id');
  t.true(entry.handshaked, 'should set handshaked to true');
});

test.serial('should load plugin', async (t) => {
  const entry = new Entry({} as NodeJS.Process);
  entry.clientId = '';
  entry.handshaked = false;
  const stubLoadPlugin = sinon.stub(loadPlugin, 'default');
  const mockPkg = { name: 'mockPlugin', pipcook: { target: { PYTHONPATH: '/mock/python/path' } } };
  await entry.load(mockPkg as any);
  t.true(stubLoadPlugin.calledOnce, 'loadPlugin should be called once');
  t.deepEqual(stubLoadPlugin.args[0], [ mockPkg ], 'loadPlugin should be called with args');
});

test.serial('should load plugin with tfjs', async (t) => {
  const entry = new Entry({} as NodeJS.Process);
  const stubLoadPlugin = sinon.stub(loadPlugin, 'default');
  const stubRedictDependency = sinon.stub(utils, 'redirectDependency');
  const mockPkg = { name: 'mockPlugin', dependencies: { '@tensorflow/tfjs-node-gpu': '^1.0.0' } };
  await entry.load(mockPkg as any);
  t.true(stubLoadPlugin.calledOnce, 'loadPlugin should be called once');
  t.deepEqual(stubLoadPlugin.args[0], [ mockPkg ], 'loadPlugin should be called with args');
  t.true(stubRedictDependency.calledOnce, 'stubRedictDependency should be called once');
  t.is(stubRedictDependency.args[0][0], '@tensorflow/tfjs-node-gpu', 'stubRedictDependency should be called with tfjs');
});

test.serial.cb('should start dataProcess plugin', (t) => {
  const entry = new Entry({} as NodeJS.Process);
  const mockPkg = { name: 'mockPlugin', pipcook: { category: 'dataProcess' }, version: '1.0.0' };
  const stubPluginEntry = sinon.stub().resolves();
  entry.plugins[`${mockPkg.name}@${mockPkg.version}`] = stubPluginEntry;
  const stubLoaderLen = sinon.stub().resolves(2);
  const stubLoaderGetItem = sinon.stub().resolves({ data: 'mockSample' });
  const stubLoaderSetItem = sinon.stub().resolves();
  const stubLoaderNotifyProcess = sinon.stub().callsFake(() => {
    if (stubLoaderNotifyProcess.callCount === 2) {
      t.true(stubLoaderLen.calledOnce, 'stubLoaderLen should be called once');
      t.true(stubLoaderGetItem.calledTwice, 'stubLoaderGetItem should be called twice');
      t.true(stubLoaderSetItem.calledTwice, 'stubLoaderSetItem should be called twice');
      t.true(stubLoaderSetItem.calledTwice, 'stubLoaderSetItem should be called twice');
      t.deepEqual(stubPluginEntry.args[0],
        [ { data: 'mockSample' }, 'mockMetadata', 'mockArgs' ],
        'stubPluginEntry should be called twice');
      t.true(stubPluginEntry.calledTwice, 'stubPluginEntry should be called twice');
      t.end();
    }
  });
  entry.start(mockPkg as any, {
    trainLoader: {
      len: stubLoaderLen,
      getItem: stubLoaderGetItem,
      setItem: stubLoaderSetItem,
      notifyProcess: stubLoaderNotifyProcess
    },
    metadata: 'mockMetadata'
  }, 'mockArgs');
});

test('should start datasetProcess plugin', async (t) => {
  const entry = new Entry({} as NodeJS.Process);
  const mockPkg = { name: 'mockPlugin', pipcook: { category: 'datasetProcess' }, version: '1.0.0' };
  const stubPluginEntry = sinon.stub().resolves();
  entry.plugins[`${mockPkg.name}@${mockPkg.version}`] = stubPluginEntry;

  await entry.start(mockPkg as any, 'mockDataset', 'mockArgs');
  t.true(stubPluginEntry.calledOnce, 'plugin entry should be called once');
  t.deepEqual(stubPluginEntry.args[0], [ 'mockDataset', 'mockArgs' ], 'plugin entry should be called once');
});

test('should start other plugins', async (t) => {
  const entry = new Entry({} as NodeJS.Process);
  const mockPkg = { name: 'mockPlugin', pipcook: { category: 'modelDefine' }, version: '1.0.0' };
  const stubPluginEntry = sinon.stub().resolves('mockResp');
  const stubGenerateId = sinon.stub().returns('mockId');
  sinon.stub(core, 'generateId').get(sinon.stub().returns(stubGenerateId));
  entry.plugins[`${mockPkg.name}@${mockPkg.version}`] = stubPluginEntry;

  t.deepEqual(
    await entry.start(mockPkg as any, 'mockDataset', 'mockArgs'),
    { id: 'mockId', __flag__: previousFlag },
    'plugin response should be a previouse data'
  );
  t.true(stubPluginEntry.calledOnce, 'plugin entry should be called once');
  t.deepEqual(stubPluginEntry.args[0], [ 'mockDataset', 'mockArgs' ], 'plugin entry should be called once');
});

test('start plugin which has not been loaded', async (t) => {
  const entry = new Entry({} as NodeJS.Process);
  const mockPkg = { name: 'mockPlugin', pipcook: { category: 'modelDefine' }, version: '1.0.0' };

  await t.throwsAsync(
    entry.start(mockPkg as any, 'mockDataset', 'mockArgs'),
    { instanceOf: TypeError, message: 'the plugin(mockPlugin@1.0.0) not loaded.' },
    'should throw error'
  );
});

test.cb('should destroy entry', (t) => {
  const stubExit = sinon.stub().callsFake((code: number) => {
    t.is(code, 0);
    t.end();
  });
  const entry = new Entry({ exit: stubExit } as any);
  entry.destroy();
});
