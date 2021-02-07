import test from 'ava';
import * as sinon from 'sinon';
import { IPCInput } from '../protocol';
import { IPCProxy } from './ipc-proxy';

test('should constrcute IPCProxy', (t) => {
  const mockChildProcess = {
    on: sinon.stub(),
    once: sinon.stub()
  };
  new IPCProxy('', mockChildProcess as any, 2000);
  t.true(mockChildProcess.on.calledOnce, 'on should be called once');
  t.is(mockChildProcess.on.args[0][0], 'message', 'message event should be listened');
  t.true(mockChildProcess.once.calledOnce, 'once should be called once');
  t.is(mockChildProcess.once.args[0][0], 'exit', 'exit event should be listened');
});

test('should call ipc method but child not connected', async (t) => {
  const mockChildProcess = {
    on: sinon.stub(),
    once: sinon.stub(),
    connected: false
  };
  const ipc = new IPCProxy('', mockChildProcess as any, 2000);
  await t.throwsAsync(
    ipc.call('ipcMethod'),
    { instanceOf: TypeError, message: 'the process is disconnected.' },
    'should throw error if not connected'
  );
});

test('should call ipc method but send error', async (t) => {
  const mockChildProcess = {
    on: sinon.stub(),
    once: sinon.stub(),
    send: sinon.stub().returns(false),
    connected: true
  };
  const ipc = new IPCProxy('', mockChildProcess as any, 2000);
  await t.throwsAsync(
    ipc.call('ipcMethod', [ 1, 2, 3 ], 100),
    { instanceOf: TypeError, message: 'send ipc message error' },
    'should throw error'
  );
});

test('should call ipc method but send error from callback', async (t) => {
  const mockChildProcess = {
    on: sinon.stub(),
    once: sinon.stub(),
    send: sinon.stub().callsFake((message: IPCInput, cb: (err: Error) => void) => {
      process.nextTick(() => cb(new TypeError('mock send error')));
      return true;
    }),
    connected: true
  };
  const ipc = new IPCProxy('', mockChildProcess as any, 2000);
  await t.throwsAsync(
    ipc.call('ipcMethod', [ 1, 2, 3 ], 100),
    { instanceOf: TypeError, message: 'mock send error' },
    'should throw error'
  );
});

test.serial('should call ipc method but response timeout', async (t) => {
  const mockChildProcess = {
    on: sinon.stub(),
    once: sinon.stub(),
    send: sinon.stub().callsFake((message: IPCInput, cb: (err: Error) => void) => {
      process.nextTick(() => cb(null));
      return true;
    }),
    connected: true
  };
  const clock = sinon.useFakeTimers();
  const subClearTimeout = sinon.spy(clock, "clearTimeout");
  const ipc = new IPCProxy('', mockChildProcess as any, 3000);
  const future = ipc.call('ipcMethod', [ 1, 2, 3 ], 100);
  clock.tick(100);
  await t.throwsAsync(
    future,
    { instanceOf: TypeError, message: 'call \'ipcMethod\' timeout.' },
    'should timeout'
  );
  t.false(subClearTimeout.called, 'should not clear timeout');
});

test.serial('should call ipc method', async (t) => {
  const mockChildProcess = {
    on: sinon.stub(),
    once: sinon.stub(),
    send: sinon.stub().returns(true),
    connected: true
  };
  const clock = sinon.useFakeTimers();
  const subClearTimeout = sinon.spy(clock, "clearTimeout");
  const ipc = new IPCProxy('', mockChildProcess as any, 3000);
  const future = ipc.call('ipcMethod', [ 1, 2, 3 ], 100);
  t.is(Object.keys(ipc.callMap).length, 1, 'length of callMap should be 1');
  ipc.callMap[0](null, { data: 'mockData' });
  clock.tick(100);
  t.deepEqual(await future, { data: 'mockData' }, 'should get the result');
  t.true(subClearTimeout.calledOnce, 'should clear timeout');
});

test.serial('should call ipc method without timeout', async (t) => {
  const mockChildProcess = {
    on: sinon.stub(),
    once: sinon.stub(),
    send: sinon.stub().returns(true),
    connected: true
  };
  const clock = sinon.useFakeTimers();
  const subSetTimeout = sinon.spy(clock, "setTimeout");
  const subClearTimeout = sinon.spy(clock, "clearTimeout");
  const ipc = new IPCProxy('', mockChildProcess as any, 3000);
  const future = ipc.call('ipcMethod', [ 1, 2, 3 ], 0);
  t.is(Object.keys(ipc.callMap).length, 1, 'length of callMap should be 1');
  clock.tick(60000);
  ipc.callMap[0](null, { data: 'mockData' });
  t.deepEqual(await future, { data: 'mockData' }, 'should get the result');
  t.false(subClearTimeout.called, 'should not clear timeout');
  t.false(subSetTimeout.called, 'should not set timeout');
});

test.serial('should call ipc method and get the error response', async (t) => {
  const mockChildProcess = {
    on: sinon.stub(),
    once: sinon.stub(),
    send: sinon.stub().returns(true),
    connected: true
  };
  const clock = sinon.useFakeTimers();
  const subClearTimeout = sinon.spy(clock, "clearTimeout");
  const ipc = new IPCProxy('', mockChildProcess as any, 3000);
  const future = ipc.call('ipcMethod', undefined);
  t.is(Object.keys(ipc.callMap).length, 1, 'length of callMap should be 1');
  ipc.callMap[0](new TypeError('mock error'), null);
  clock.tick(3000);
  await t.throwsAsync(future, { instanceOf: TypeError, message: 'mock error' }, 'should get the error response');
  t.true(subClearTimeout.calledOnce, 'should clear timeout');
});

test('should cleanup ipc', async (t) => {
  const mockChildProcess = {
    on: sinon.stub(),
    once: sinon.stub(),
    off: sinon.stub(),
    connected: true
  };
  const ipc = new IPCProxy('mockId', mockChildProcess as any, 3000);
  const stubCancel = sinon.stub().callsFake((err: Error, result: Record<string, any>) => {
    t.is(err.message, 'the runnable(mockId) has been destroyed with(code=1, signal=mockSignal).');
    t.is(result, null, 'result should be null');
  });
  ipc.callMap[0] = stubCancel;
  const stubLisener = sinon.stub();
  ipc.onCleanup(stubLisener, 1, 'mockSignal');
  t.true(mockChildProcess.off.calledOnce, 'off should be called once');
  t.deepEqual(mockChildProcess.off.args[0], [ 'message', stubLisener ], 'message event should be off');
  t.true(stubCancel.calledOnce, 'stubCancel should be called once');
  t.deepEqual(ipc.callMap, {}, 'callMap should be empty');
});

test('should handle message from ipc', async (t) => {
  const mockChildProcess = {
    on: sinon.stub(),
    once: sinon.stub(),
    connected: true
  };
  const ipc = new IPCProxy('', mockChildProcess as any, 3000);
  const stubHandler = sinon.stub();
  ipc.callMap[0] = stubHandler;
  ipc.msgHandler({ id: 0, error: null, result: { data: 'mockData' } });
  t.true(stubHandler.calledOnce, 'handler should be called once');
  t.deepEqual(stubHandler.args[0], [ null, { data: 'mockData' } ], 'handler should be called with result');
});

test('should handle invalid message from ipc', async (t) => {
  const mockChildProcess = {
    on: sinon.stub(),
    once: sinon.stub(),
    connected: true
  };
  const ipc = new IPCProxy('', mockChildProcess as any, 3000);
  const stubHandler = sinon.stub();
  ipc.callMap[0] = stubHandler;
  ipc.msgHandler('' as any);
  t.false(stubHandler.called, 'handler should not be called');
});

test('should handle invalid message id from ipc', async (t) => {
  const mockChildProcess = {
    on: sinon.stub(),
    once: sinon.stub(),
    connected: true
  };
  const ipc = new IPCProxy('', mockChildProcess as any, 3000);
  const stubHandler = sinon.stub();
  ipc.callMap[0] = stubHandler;
  ipc.msgHandler({ id: 1, error: null, result: '' });
  t.false(stubHandler.called, 'handler should not be called');
});

test('should handle message from ipc with error', async (t) => {
  const mockChildProcess = {
    on: sinon.stub(),
    once: sinon.stub(),
    connected: true
  };
  const ipc = new IPCProxy('', mockChildProcess as any, 3000);
  const stubHandler = sinon.stub();
  ipc.callMap[0] = stubHandler;
  ipc.msgHandler({ id: 0, error: { message: 'mock message', stack: 'mock stack' }, result: null });
  t.true(stubHandler.calledOnce, 'handler should be called once');
  const { message, stack } = stubHandler.args[0][0];
  t.deepEqual({ message, stack }, { message: 'mock message', stack: 'mock stack' }, 'handler should be called with error');
  t.is(stubHandler.args[0][1], null, 'handler should be called with result null');
});
