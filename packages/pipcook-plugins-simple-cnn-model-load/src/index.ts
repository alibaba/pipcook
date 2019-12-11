/**
 * @file This plugin is used to load the simple CNN for iamge classification. 
 */

import {ModelLoadType, PipcookModel, UniformSampleData, getModelDir, getMetadata} from '@pipcook/pipcook-core';
import * as tf from '@tensorflow/tfjs-node-gpu';
import * as assert from 'assert';
import * as path from 'path';
/**
 * assertion test
 * @param data 
 */
const assertionTest = (data: UniformSampleData) => {
  assert.ok(data.metaData.feature, 'Image feature is missing');
  assert.ok(data.metaData.feature.shape.length === 3, 'The size of an image must be 2d or 3d');
  assert.ok(data.metaData.label.shape && data.metaData.label.shape.length == 2, 'The label vector should be a one hot vector');
}

const simpleCnnModelLoad: ModelLoadType = async (data: UniformSampleData, args?: any): Promise<PipcookModel> => {
  const {
    optimizer = tf.train.rmsprop(0.00005, 1e-7),
    loss = 'categoricalCrossentropy',
    metrics = ['accuracy'],
    modelId=''
  } = args || {};

  let inputShape, outputShape: number[];
  if (!modelId) {
    assertionTest(data);
    assert.ok(args && args.modelName, 'Please give your model a name');
    inputShape = data.metaData.feature.shape;
    outputShape = data.metaData.label.shape;
  }
  
  let model: tf.Sequential | null = null;
  if (modelId) {
    model = <tf.Sequential>(await tf.loadLayersModel('file://' + path.join(getModelDir(modelId), 'model.json')));
    const metaData = getMetadata(modelId);
    data = <UniformSampleData>{metaData};
  } else {
    model = tf.sequential();
    model.add(tf.layers.conv2d({
      inputShape: inputShape,
      filters: 32,
      kernelSize: 3,
      activation: 'relu',
      kernelInitializer: 'glorotUniform',
      padding: 'same'
    }));
    model.add(tf.layers.conv2d({
      filters: 32,
      kernelSize: 3,
      activation: 'relu',
      kernelInitializer: 'glorotUniform',
    }));
    model.add(tf.layers.maxPooling2d({poolSize: [2, 2]}));
    model.add(tf.layers.dropout({rate: 0.25}));
    model.add(tf.layers.conv2d({
      filters: 64,
      kernelSize: 3,
      activation: 'relu',
      kernelInitializer: 'glorotUniform',
      padding: 'same'
    }));
    model.add(tf.layers.conv2d({
      filters: 64,
      kernelSize: 3,
      activation: 'relu',
      kernelInitializer: 'glorotUniform'
    }));
    model.add(tf.layers.maxPooling2d({poolSize: [2, 2]}));
    model.add(tf.layers.dropout({rate: 0.25}));
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({units: 512, activation: 'relu', kernelInitializer: 'glorotUniform'}));
    model.add(tf.layers.dropout({rate: 0.5}));
    model.add(tf.layers.dense({units: outputShape[1], activation: 'softmax', kernelInitializer: 'glorotUniform'}));
  }

  (<tf.Sequential>model).compile({
    optimizer,
    loss,
    metrics,
  });
  
  const result: PipcookModel = {
    model,
    type: 'image classification',
    inputShape: inputShape,
    outputShape: outputShape,
    inputType: 'float32',
    outputType: 'int32',
    metrics: metrics,
    save: async function(modelPath: string) {
      await this.model.save('file://' + modelPath);
    },
    predict: function (inputData: tf.Tensor<any>) {
      const predictResult = (this.model.predict(inputData)).dataSync();
      let count = 0;
      let prop = predictResult[count];
      for (let j = 1; j < predictResult.length; j++) {
        if (predictResult[j] > prop) {
          count = j;
          prop = predictResult[j];
        }
      }
      let index = null;
      if (data.metaData.label.valueMap) {
        for (let key in data.metaData.label.valueMap) {
          if (data.metaData.label.valueMap[key] === count) {
            index = key;
          }
        }
      }
      if (index !== null) {
        return index;
      }
      return predictResult;
    },
    modelName: (<string>(args.modelName))
  };

  return result;
}

export default simpleCnnModelLoad;