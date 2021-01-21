import test from 'ava';
import * as sinon from 'sinon';
import { Entry, ipcMethods, previousFlag } from './entry';

test.serial.beforeEach(() => sinon.restore());

test('should constrcute Entry an setup it', (t) => {
  const beforeLengh = process.listeners('message').length;
  const entry = new Entry({} as NodeJS.Process);
  entry.setup();
  t.true(process.listeners('message').length > beforeLengh, 'message event should be listen');
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
  t.true(stubSend.calledOnce, `send shoud be called once`);
  t.deepEqual(stubSend.args[0], [ { id: 0, error: null, result: '123' } ], 'should send ipc result');
  t.true(stubMethod.calledOnce, `method 'handshake' shoud be called once`);
});

test.serial('should send ipc response to parent', async (t) => {
  const stubConsoleError = sinon.stub(console, 'error');
  const stubSend = sinon.stub().returns(true);
  const entry = new Entry({ send: stubSend } as any);
  entry.send({id: 0, error: null, result: '123'});
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
  entry.send({id: 0, error: null, result: '123'});
  t.true(stubSend.calledOnce, 'process.send should be called once');
  t.deepEqual(stubSend.args[0][0], { id: 0, error: null, result: '123' }, 'process.send should be called with args');
  t.is(typeof stubSend.args[0][1], 'function', 'process.send should be called with callback');
  t.true(stubConsoleError.calledOnce, 'failed to send a message to parent process.');
});

test.serial('should send ipc response to parent but fails with callback', async (t) => {
  const stubConsoleError = sinon.stub(console, 'error');
  const stubSend = sinon.stub().returns(true);
  const entry = new Entry({ send: stubSend } as any);
  entry.send({id: 0, error: null, result: '123'});
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
