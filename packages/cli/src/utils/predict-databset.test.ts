import test from 'ava';
import * as sinon from 'sinon';
import { PipelineType } from '@pipcook/costa';
import { makePredictDataset } from './predict-dataset';

test.serial.afterEach(() => sinon.restore());

test('unsupported type', async (t) => {
  t.is(makePredictDataset([], -1 as any), null);
});

test('make object detection dataset', async (t) => {
  const dataset = makePredictDataset([ 's' ], PipelineType.ObjectDetection);
  t.deepEqual(await dataset.predicted.next(), { data: { uri: 's' }, label: undefined });
});

test('make object detection dataset from buffer', async (t) => {
  const buffer = Buffer.from([ 1 ]);
  const dataset = makePredictDataset([ buffer ], PipelineType.ObjectDetection);
  t.deepEqual(await dataset.predicted.next(), { data: { buffer: buffer.buffer }, label: undefined });
});

test('make image classification dataset', async (t) => {
  const dataset = makePredictDataset([ 's' ], PipelineType.ImageClassification);
  t.deepEqual(await dataset.predicted.next(), { data: { uri: 's' }, label: undefined });
});

test('make image classification dataset from buffer', async (t) => {
  const buffer = Buffer.from([ 1 ]);
  const dataset = makePredictDataset([ buffer ], PipelineType.ImageClassification);
  t.deepEqual(await dataset.predicted.next(), { data: { buffer: buffer.buffer }, label: undefined });
});
