import {
  createStubInstance,
  sinon
} from '@loopback/testlab';
import test from 'ava';
import { BaseEventController } from '../../../controllers/base';
import { TraceService, PipcookEvent, Tracer } from '../../../services';
import { Writable } from 'stream';
import * as utils from '../../../utils';

test.serial.afterEach(() => {
  sinon.restore();
});

test.serial('trace event', async (t) => {
  // mock Response
  class MyResponse extends Writable {
    status = sinon.stub();
    send = sinon.stub();
    end = sinon.stub();
    constructor() {
      super();
      this.status.returns(this);
      this.send.returns(undefined);
    }
    _write(chunk: any, encoding: string, cb: () => void) {
      cb();
    }
  }
  const response = new MyResponse();
  // mock request
  const request = {
    socket: {
      setKeepAlive: sinon.stub(),
      setNoDelay: sinon.stub(),
      setTimeout: sinon.stub()
    }
  };

  const traceService = createStubInstance<TraceService>(TraceService);
  const baseEventController = new BaseEventController(traceService);
  baseEventController.ctx = {
    response,
    request
  } as any;

  const mockPipelinePromisify = sinon.stub(utils, 'pipelinePromisify').callsFake((): Promise<void> => {
    return new Promise<void>((resolve) => {
      process.nextTick(resolve);
    });
  }
  );
  const tracer = createStubInstance<Tracer>(Tracer);
  tracer.stubs.listen.callsFake((cb: (data: PipcookEvent) => void) => {
    process.nextTick(() => {
      cb({ type: 'log', data: { data: 'mock message', level: 'info' } } as any);
    });
  });
  tracer.stubs.wait.callsFake(() => {
    return new Promise((resolve) => {
      process.nextTick(resolve);
    });
  });
  traceService.stubs.get.returns(tracer);
  await t.notThrowsAsync(baseEventController.event('traceId'), 'event trace check');
  t.true(mockPipelinePromisify.calledOnce, 'pipelinePromisify should be called once');
});

test('trace an nonexistent tracer', async (t) => {
  const traceService = createStubInstance<TraceService>(TraceService);
  const baseEventController = new BaseEventController(traceService);
  const response = {
    status: sinon.stub(),
    send: sinon.stub(),
    end: sinon.stub()
  };
  response.status.returns(response);
  response.send.returns(undefined);
  baseEventController.ctx = {
    response
  } as any;
  traceService.stubs.get.returns(undefined);
  await t.notThrowsAsync(baseEventController.event('traceId'));
});
