import test from 'ava';
import * as sinon from 'sinon';
import { Entry, ipcMethods } from './entry';

test('should constrcute Entry an setup it', (t) => {
  const beforeLengh = process.listeners('message').length;
  const entry = new Entry();
  entry.setup();
  t.true(process.listeners('message').length > beforeLengh, 'message event should be listen');
});

test('should throw rejection', (t) => {
  const entry = new Entry();
  t.throws(
    () => entry.onUnhandledRejection(new Error('mock error')),
    { instanceOf: Error, message: 'mock error' },
    'should throw error'
  );
});

function testOnMessage(methodList: string[], isMethodError: boolean) {
  methodList.map((method) => {
    test(`should process ipc request for '${method}' with ${isMethodError ? '' : 'no '}error`, async (t) => {
      const entry = new Entry();
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
    const entry = new Entry();
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

test(`should process ipc request for 'handshake' but not handshaked`, async (t) => {
  const entry = new Entry();
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
