import { PipcookClient } from '../src';
import * as request from '../src/request';
import sinon from 'sinon';
import { parse } from 'url';

describe('test pipeline apis', () => {
  const pipcook = new PipcookClient();

  afterEach(() => {
    sinon.restore();
  });

  it('should call get pipeline config by id', async () => {
    const getfn = sinon.stub(request, 'get');
    await pipcook.pipeline.getConfig('id');

    const call = getfn.getCall(0) as any;
    const urlo = parse(call.firstArg, true);
    expect(urlo.pathname).toBe('/api/pipeline/id/config');
  });

  it('should call get pipeline info by id', async () => {
    const getfn = sinon.stub(request, 'get');
    await pipcook.pipeline.get('id');

    const call = getfn.getCall(0) as any;
    const urlo = parse(call.firstArg, true);
    expect(urlo.pathname).toBe('/api/pipeline/id');
  });
});
