import test from 'ava';
import * as sinon from 'sinon';
import { setup, killProcessIfError } from './parent';
import { IPCProxy } from './ipc-proxy';

sinon.stub(IPCProxy.prototype, 'call').resolves();

test('should setup proxy for parent', async (t) => {
  const mockChildProcess = {
    on: sinon.stub(),
    once: sinon.stub()
  };
  const entry = setup('mockId', mockChildProcess as any);
  [ 'handshake', 'load', 'start', 'destroy', 'valueOf' ].forEach((method) => {
    t.true(method in entry, `should impelement ${method}`);
  });
});

test('should call hanshake', async (t) => {
  const mockChildProcess = {
    on: sinon.stub(),
    once: sinon.stub()
  };
  const entry = setup('mockId', mockChildProcess as any);
  await t.notThrowsAsync(entry.handshake(), 'should not throw error');
});

test('should call load', async (t) => {
  const mockChildProcess = {
    on: sinon.stub(),
    once: sinon.stub()
  };
  const entry = setup('mockId', mockChildProcess as any);
  await t.notThrowsAsync(entry.load({} as any, 100), 'should not throw error');
});

test('should call start', async (t) => {
  const mockChildProcess = {
    on: sinon.stub(),
    once: sinon.stub()
  };
  const entry = setup('mockId', mockChildProcess as any);
  await t.notThrowsAsync(entry.start({} as any), 'should not throw error');
});

test('should call destroy', async (t) => {
  const mockChildProcess = {
    on: sinon.stub(),
    once: sinon.stub()
  };
  const entry = setup('mockId', mockChildProcess as any);
  await t.notThrowsAsync(entry.destroy(100), 'should not throw error');
});

test('should call valueOf', async (t) => {
  const mockChildProcess = {
    on: sinon.stub(),
    once: sinon.stub()
  };
  const entry = setup('mockId', mockChildProcess as any);
  await t.notThrowsAsync(entry.valueOf({} as any), 'should not throw error');
});

test('call method but error happens', async (t) => {
  const stubKill = sinon.stub();
  await t.throwsAsync(
    killProcessIfError(
      { kill: stubKill } as any,
      Promise.reject(new TypeError('mock error'))
    ),
    { instanceOf: TypeError, message: 'mock error' },
    'should throw error'
  );
  t.true(stubKill.calledOnce, 'kill should be called once');
  t.deepEqual(stubKill.args[0], [ 'SIGKILL' ], 'should call kill with SIGKILL');
});

test('call method an not error happens', async (t) => {
  const stubKill = sinon.stub();
  await t.notThrowsAsync(
    killProcessIfError(
      { kill: stubKill } as any,
      Promise.resolve()
    ),
    'should not throw error'
  );
  t.false(stubKill.called, 'kill should not been called');
});
