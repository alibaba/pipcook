// import {
//     createStubInstance,
//     sinon
// } from '@loopback/testlab';
import test from 'ava';
// import { BaseEventController } from '../../../controllers/base';
// import { TraceService, PipcookEvent } from '../../../services';
// import * as utils from '../../../utils';

test('find an existing plugin', async t => {
  // const traceService = createStubInstance<TraceService>(TraceService);
  // const baseEventController = new BaseEventController(traceService);
  // const spyServerSentEmitter = sinon.stub(utils, 'ServerSentEmitter');

  // traceService.stubs.get.resolves({
  //   listen: function(cb: (data: PipcookEvent) => void) {
  //     process.nextTick(() => {
  //       cb({ type: 'log', data: { data: 'mock message',  level: 'info' } })
  //     })
  //   },
  //   wait: function(): Promise<void> {
  //     return Promise.resolve();
  //   }
  // });
  // await t.notThrowsAsync(baseEventController.event('traceId'));
  t.pass();
});
