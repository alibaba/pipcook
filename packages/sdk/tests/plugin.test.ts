import { PipcookClient } from '../src';
import * as request from '../src/request';
import * as sinon from 'sinon';
import { parse } from 'url';

describe('test plugin apis', () => {
  const pipcook = new PipcookClient();

  afterEach(() => {
    sinon.restore();
  });

  it('should call fetch plugin by id', async () => {
    const getfn = sinon.stub(request, 'get');
    await pipcook.plugin.fetch('id');

    const call = getfn.getCall(0) as any;
    const urlo = parse(call.firstArg, true);
    expect(urlo.pathname).toBe('/api/plugin/id/metadata');
  });

  it('should call fetch plugin by name', async () => {
    const getfn = sinon.stub(request, 'get');
    await pipcook.plugin.fetchByName('foobar');

    const call = getfn.getCall(0) as any;
    const urlo = parse(call.firstArg, true);
    expect(urlo.pathname).toBe('/api/plugin/metadata');
    expect(call.args[1].name).toBe('foobar');
  });
});
