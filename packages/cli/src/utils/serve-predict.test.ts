import test from 'ava';
import * as express from 'express';
import * as sinon from 'sinon';
import * as path from 'path';
import { stop, predictText, predictImage, serveText, serveImage, serve } from './serve-predict';
import { PipelineType } from '@pipcook/costa';

test.serial.afterEach(() => sinon.restore());

test.serial('serveText', async (t) => {
  const mockStatic: any = {};
  const stubStatic = sinon.stub(express, 'static').returns(mockStatic);
  const app = express();
  const stubUse = sinon.stub(app, 'use').returns(app);
  const stubGet = sinon.stub(app, 'get').returns(app);
  const mockCb = sinon.stub();
  serveText(app, mockCb);
  t.true(stubStatic.calledOnce);
  t.true(stubGet.calledOnce);
  t.true(stubUse.calledOnce);
  t.is(stubStatic.args[0][0], path.join(__dirname, '../../serve-resource/text'));
});

test.serial('serveImage', async (t) => {
  const mockStatic: any = {};
  const stubStatic = sinon.stub(express, 'static').returns(mockStatic);
  const app = express();
  const stubUse = sinon.stub(app, 'use').returns(app);
  const stubGet = sinon.stub(app, 'get').returns(app);
  const mockCb = sinon.stub();
  serveImage(app, mockCb);
  t.true(stubStatic.calledOnce);
  t.true(stubGet.calledOnce);
  t.true(stubUse.calledOnce);
  t.is(stubStatic.args[0][0], path.join(__dirname, '../../serve-resource/image'));
});

test.serial('predict image', async (t) => {
  const mockPredictResult = { mock: 'value' };
  const mockCb = sinon.stub().resolves(mockPredictResult);
  const req: any = {
    files: [ { buffer: Buffer.from([ 1, 2, 3 ]) }, { buffer: Buffer.from([ 2, 3, 4 ]) } ]
  };
  const resp: any = {
    json: sinon.stub()
  };
  await predictImage(mockCb, req, resp);
  t.true(mockCb.calledOnce);
  t.true(resp.json.calledOnce);
  t.deepEqual(resp.json.args[0][0], { success: true, data: mockPredictResult });
});

test.serial('predict image but no data', async (t) => {
  const message = 'no file available';
  const mockCb = sinon.stub();
  const req: any = {
    files: undefined
  };
  const resp: any = {
    json: sinon.stub()
  };
  await predictImage(mockCb, req, resp);
  t.false(mockCb.called);
  t.true(resp.json.calledOnce);
  t.deepEqual(resp.json.args[0][0], { success: false, message });
});

test.serial('predict text', async (t) => {
  const mockPredictResult = { mock: 'value' };
  const mockCb = sinon.stub().resolves(mockPredictResult);
  const req: any = {
    query: { input: [ 'input1', 'input2' ] }
  };
  const resp: any = {
    json: sinon.stub()
  };
  await predictText(mockCb, req, resp);
  t.true(mockCb.calledOnce);
  t.deepEqual(mockCb.args[0][0], req.query.input);
  t.true(resp.json.calledOnce);
  t.deepEqual(resp.json.args[0][0], { success: true, data: mockPredictResult });
});

test.serial('predict text but no input', async (t) => {
  const message = 'no input available';
  const mockCb = sinon.stub();
  const req: any = {
    query: {}
  };
  const resp: any = {
    json: sinon.stub()
  };
  await predictText(mockCb, req, resp);
  t.false(mockCb.called);
  t.true(resp.json.calledOnce);
  t.deepEqual(resp.json.args[0][0], { success: false, message });
});

test('serve predict but pipeline type is not valid', async (t) => {
  const mockCb = sinon.stub();
  await t.throwsAsync(
    serve(1234, undefined, mockCb),
    { message: 'Pipeline type is not supported: undefined' }
  );
  t.false(mockCb.called);
});

test('start and stop', async (t) => {
  const mockCb = sinon.stub();
  await t.notThrowsAsync(serve(1234, PipelineType.TextClassification, mockCb));
  await t.notThrowsAsync(stop());
});
