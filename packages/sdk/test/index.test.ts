import { PipcookClient } from '../src';
import * as request from '../src/request';
import sinon from 'sinon';

describe('test job apis', () => {
  const pipcook = new PipcookClient();
  afterEach(() => {
    sinon.restore();
  })

  it('should get the verisons of server', async () => {
    const getfn = sinon.stub(request, 'get').returns(Promise.resolve({versions: { daemon: '1.1.1' } }));
    const resp = await pipcook.listVersions();
    expect(resp.versions.daemon).toBe('1.1.1');
    expect(getfn.calledOnce);
  });

  it('decorator test with error', async () => {
    const onError = sinon.fake((err: Error) => {});
    const pipcook = new PipcookClient('http://127.0.0.1', 6927, { onError });
    const error = new Error('err');
    sinon.stub(request, 'get').throws(error);
    await pipcook.listVersions();
    onError.calledOnceWithExactly(error);
  });

  it('decorator test with promise error', async () => {
    const onError = sinon.fake((err: Error) => {});
    const pipcook = new PipcookClient('http://127.0.0.1', 6927, { onError });
    const error = new Error('err');
    sinon.stub(request, 'get').returns(Promise.reject(error));
    await pipcook.listVersions();
    onError.calledOnceWithExactly(error);
  });

});
