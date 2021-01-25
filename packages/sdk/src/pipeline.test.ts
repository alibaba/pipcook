import test from 'ava';
import { PipcookClient } from '.';
import * as request from './request';
import * as sinon from 'sinon';
import { parse } from 'url';


test.serial.afterEach(() => sinon.restore());

test.serial('should call get pipeline config by id', async (t) => {
  const pipcook = new PipcookClient();
  const getfn = sinon.stub(request, 'get');
  await pipcook.pipeline.getConfig('id');

  const call = getfn.getCall(0) as any;
  const urlo = parse(call.firstArg, true);
  t.is(urlo.pathname, '/api/pipeline/id/config');
});

test.serial('should call get pipeline info by id', async (t) => {
  const pipcook = new PipcookClient();
  const getfn = sinon.stub(request, 'get');
  await pipcook.pipeline.get('id');

  const call = getfn.getCall(0) as any;
  const urlo = parse(call.firstArg, true);
  t.is(urlo.pathname, '/api/pipeline/id');
});
