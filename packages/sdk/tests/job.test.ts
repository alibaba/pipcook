import { PipcookClient } from '../src';
import sinon from 'sinon';
import * as request from '../src/request';

describe('test job apis', () => {
  const pipcook = new PipcookClient();
  afterEach(() => {
    sinon.restore();
  });

  it('should call get output download url by id', async () => {
    expect(pipcook.job.getOutputDownloadURL('myid'))
      .toBe(`${pipcook.endpoint}/job/myid/output`);
  });

  it('should download output by id', async () => {
    const getFile = sinon.stub(request, 'getFile').resolves({
      headers: {
        'content-disposition': 'attachment; filename="pipcook-output-u9fo9dlt.tar.gz"',
        'content-type': 'application/gzip'
      },
      totalBytes: 123,
      stream: null
    });
    const fileDownload = await pipcook.job.downloadOutput('myid');
    expect(fileDownload.filename).toBe('pipcook-output-u9fo9dlt.tar.gz');
    expect(fileDownload.mimeType).toBe('application/gzip');
    expect(fileDownload.totalBytes).toBe(123);
    expect(fileDownload.stream).toBe(null);
    getFile.calledOnceWithExactly(`${pipcook.endpoint}/job/myid/output`);
  });
});
