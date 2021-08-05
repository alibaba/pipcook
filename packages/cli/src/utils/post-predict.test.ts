import test from 'ava';
import * as sinon from 'sinon';
import * as fs from 'fs-extra';
import { PipelineType } from '@pipcook/costa';
import { processData } from './post-predict';
import * as Jimp from 'jimp';

test.serial.afterEach(() => sinon.restore());

test.serial('should process object detection', async (t) => {
  const result = [
    [
      {
        id: 1,
        category: 'mock-category',
        score: 0.5,
        box: [ 0, 0, 15, 15 ]
      }
    ]
  ];
  const stubWrite = sinon.stub(Jimp.prototype, 'write').resolves();
  await t.notThrowsAsync(processData(result, {
    type: PipelineType.ObjectDetection,
    inputs: [ __dirname + '/../../../../docs/images/logo.png' ]
  }));
  t.true(stubWrite.calledOnce, 'write should be called once');
});

test.serial('should process object detection with buffer', async (t) => {
  const result = [
    [
      {
        id: 1,
        category: 'mock-category',
        score: 0.5,
        box: [ 0, 0, 15, 15 ]
      }
    ]
  ];
  const stubWrite = sinon.stub(Jimp.prototype, 'write').resolves();
  const buffer = await fs.readFile(__dirname + '/../../../../docs/images/logo.png');
  await t.notThrowsAsync(processData(result, {
    type: PipelineType.ObjectDetection,
    inputs: [ buffer ]
  }));
  t.true(stubWrite.calledOnce, 'write should be called once');
});

test.serial('should process object detection with buffer but args count not matched', async (t) => {
  const result = [
    [
      {
        id: 1,
        category: 'mock-category',
        score: 0.5,
        box: [ -10, -10, 15, 15 ]
      }
    ]
  ];
  const buffer = await fs.readFile(__dirname + '/../../../../docs/images/logo.png');
  await t.throwsAsync(processData(result, {
    type: PipelineType.ObjectDetection,
    inputs: [ buffer, buffer ]
  }), { message: 'Size of predict result is not equal to inputs.' });
});

test.serial('should process text classification', async (t) => {
  const result = [
    [
      {
        id: 1,
        category: 'mock-category',
        score: 0.5
      }
    ]
  ];
  await t.notThrowsAsync(processData(result, {
    type: PipelineType.TextClassification,
    inputs: [ 'mock input text' ]
  }));
});
