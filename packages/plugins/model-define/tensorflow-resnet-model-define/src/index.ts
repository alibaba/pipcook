/**
 * @file This plugin is used to load the moblieNet for iamge classification. The input layer is modified to fit into any shape of input.
 * The final layer is changed to a softmax layer to match the output shape
 */

import { ModelDefineType, ImageDataset, ImageSample, ModelDefineArgsType, TfJsLayersModel } from '@pipcook/pipcook-core';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

const boa = require('@pipcook/boa');
const tf = boa.import('tensorflow');
const { Adam } = boa.import('tensorflow.keras.optimizers')
const { ResNet50 } = boa.import('tensorflow.keras.applications.resnet50');

/** @ignore
 * assertion test
 * @param data 
 */
const assertionTest = (data: ImageDataset) => {
  assert.ok(data.metadata.feature, 'Image feature is missing');
  assert.ok(data.metadata.feature.shape.length === 3, 'The size of an image must be 3d');
};

function argMax(array: any) {
  return [].map.call(array, (x: any, i: any) => [ x, i ]).reduce((r: any, a: any) => (a[0] > r[0] ? a : r))[1];
}

/**
 *  main function of the operator: load the mobilenet model
 * @param data sample data
 */
const resnetModelDefine: ModelDefineType = async (data: ImageDataset, args: ModelDefineArgsType): Promise<TfJsLayersModel> => {
  let {
    loss = 'categorical_crossentropy',
    metrics = [ 'accuracy' ],
    learningRate = 0.001,
    decay = 0.05,
    recoverPath,
    labelMap,
    pretrained = false
  } = args;

  let inputShape: number[];
  let outputShape: number;

  if (!recoverPath) {
    assertionTest(data);
    inputShape = data.metadata.feature.shape;
    outputShape = Object.keys(data.metadata.labelMap).length;
    labelMap = data.metadata.labelMap;
  } else {
    const log = JSON.parse(fs.readFileSync(path.join(recoverPath, 'log.json'), 'utf8'));
    labelMap = log.metadata.labelMap;
    outputShape = Object.keys(labelMap).length;
  }

  let model: any
  model = ResNet50(boa.kwargs({
    include_top: true,
    weights: pretrained ? 'imagenet' : null,
    input_shape:  inputShape,
    classes: outputShape
  }));

  if (recoverPath) {
    model.load_weights(recoverPath);
  }
  model.compile(boa.kwargs({
    optimizer: Adam(boa.kwargs({
      lr: learningRate,
      decay
    })),
    loss: loss,
    metrics: metrics
  }));

  const result: TfJsLayersModel = {
    model,
    metrics: metrics,
    predict: async function (inputData: ImageSample) {
    }
  };
  return result;
};

export default resnetModelDefine;
