import test from 'ava';
import { PipcookClient } from '.';
import * as request from './request';
import * as sinon from 'sinon';
import { parse } from 'url';


test.serial.afterEach(() => sinon.restore());

test.serial('should call fetch plugin by id', async (t) => {
  const pipcook = new PipcookClient();
  const getfn = sinon.stub(request, 'get');
  await pipcook.plugin.fetch('id');

  const call = getfn.getCall(0) as any;
  const urlo = parse(call.firstArg, true);
  t.is(urlo.pathname, '/api/plugin/id/metadata');
});

test.serial('should call fetch plugin by name', async (t) => {
  const pipcook = new PipcookClient();
  const getfn = sinon.stub(request, 'get');
  await pipcook.plugin.fetchByName('foobar');

  const call = getfn.getCall(0) as any;
  const urlo = parse(call.firstArg, true);
  t.is(urlo.pathname, '/api/plugin/metadata');
  t.is(call.args[1].name, 'foobar');
});
