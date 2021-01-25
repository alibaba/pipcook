import test from 'ava';
import { PipcookClient } from '.';
import * as sinon from 'sinon';
import * as request from './request';

test.serial.afterEach(() => {
  sinon.restore();
});

test('should call get output download url by id', async (t) => {
  const pipcook = new PipcookClient();
  t.is(pipcook.job.getOutputDownloadURL('myid'), `${pipcook.endpoint}/job/myid/output`);
});

test('should download output by id', async (t) => {
  const pipcook = new PipcookClient();
  const getFile = sinon.stub(request, 'getFile').resolves({
    headers: {
      'content-disposition': 'attachment; filename="pipcook-output-u9fo9dlt.tar.gz"',
      'content-type': 'application/gzip'
    },
    totalBytes: 123,
    stream: null
  });
  const fileDownload = await pipcook.job.downloadOutput('myid');
  t.is(fileDownload.filename, 'pipcook-output-u9fo9dlt.tar.gz');
  t.is(fileDownload.mimeType, 'application/gzip');
  t.is(fileDownload.totalBytes, 123);
  t.is(fileDownload.stream, null);
  t.true(getFile.calledOnce);
  t.deepEqual(getFile.args[0], [ `${pipcook.endpoint}/job/myid/output` ], 'getFile shoule be called with url');
});
