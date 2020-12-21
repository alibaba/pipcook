import {
    createStubInstance,
    sinon
} from '@loopback/testlab';
import test from 'ava';
import { BaseEventController } from '../../../controllers/base';
import { TraceService } from '../../../services';
import * as utils from '../../../utils';

test('find an existing plugin', async t => {
  const traceService = createStubInstance<TraceService>(TraceService);
  const baseEventController = new BaseEventController(traceService);
  const spyServerSentEmitter = sinon.stub(utils, 'ServerSentEmitter');

  traceService.stubs.get.resolves();
  await t.notThrowsAsync(baseEventController.event('traceId'));
});
