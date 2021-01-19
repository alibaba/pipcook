import { IPCInput, IPCOutput } from '../protocol';
import './entry';

const emit = process.emit.bind(process) as any;
process.send = () => {
  throw new TypeError('injection is required.');
};

describe('test entry', () => {
  it('should test emit common', (done) => {
    const spy = spyOn(process, 'send');

    const id = 'foobar';
    emit('message', {id: 1, method: 'handshake', args: [ id ]});
    process.nextTick(() => {
      const firstCall = spy.calls.first();
      expect(firstCall.args[0]).toEqual({id: 1, error: null, result: id });
      done();
    })
  });

  it('should test emit with failed result', (done) => {
    spyOn(process, 'send').and.returnValue(false);
    spyOn(console, 'error');

    const id = 'foobar2';
    emit('message', {id: 1, method: 'handshake', args: [ id ]});

    process.nextTick(() => {
      const firstCall = (console.error as any).calls.first();
      expect(firstCall.args[0]).toEqual('failed to send a message to parent process.');
      done();
    });
  });
});
