/**
 * @file This plugin is used to load the moblieNet for iamge classification. The input layer is modified to fit into any shape of input.
 * The final layer is changed to a softmax layer to match the output shape
 */

import { ModelLoadType, ImageDataset, getModelDir, getMetadata, ModelLoadArgsType, TfJsLayersModel } from '@pipcook/pipcook-core';
import * as tf from '@tensorflow/tfjs-node-gpu';
import * as assert from 'assert';
import * as path from 'path';

/**
 * Transfer learning: freeze several top layers
 * @param trainableLayers 
 * @param mobilenetModified 
 */
const freezeModelLayers = (trainableLayers: string[], mobilenetModified: tf.LayersModel) => {
  for (const layer of mobilenetModified.layers) {
    layer.trainable = false;
    for (const tobeTrained of trainableLayers) {
      if (layer.name.indexOf(tobeTrained) === 0) {
        layer.trainable = true;
        break;
      }
    }
  }
  return mobilenetModified;
};

/** @ignore
 * assertion test
 * @param data 
 */
const assertionTest = (data: ImageDataset) => {
  assert.ok(data.metaData.feature, 'Image feature is missing');
  assert.ok(data.metaData.feature.shape.length === 3, 'The size of an image must be 3d');
};

/**
 * Delete original input layer and original output layer. 
 * Use our own input layer and add softmax layer after global average pooling layer
 * @param inputLayer the input layer of the model
 * @param originModel original loaded moblienet
 */
const applyModel = (inputLayer: tf.SymbolicTensor, originModel: tf.LayersModel) => {
  let currentLayer: any = inputLayer;
  for (const layer of originModel.layers) {
    if (layer.name !== 'input_1') {
      currentLayer = layer.apply(currentLayer);
    }
    if (layer.name === 'global_average_pooling2d_1') {
      break;
    }
  }
  return currentLayer;
};

/**
 *  main function of the operator: load the mobilenet model
 * @param data sample data
 */
const localMobileNetModelLoad: ModelLoadType = async (data: ImageDataset, args: ModelLoadArgsType): Promise<TfJsLayersModel> => {
  let {
    optimizer = tf.train.rmsprop(0.00005, 1e-7),
    loss = 'categoricalCrossentropy',
    metrics = [ 'accuracy' ],
    isFreeze = true,
    modelId,
    modelPath,
    outputShape
  } = args;

  let inputShape: number[];

  if (!modelId && !modelPath) {
    assertionTest(data);
    inputShape = data.metaData.feature.shape;
    outputShape = Object.keys(data.metaData.labelMap).length;
  }

  if (modelId) {
    outputShape = Object.keys(getMetadata(modelId).labelMap);
  }

  if (modelPath) {
    assert.ok(!isNaN(outputShape), 'the output shape should be a number');
  }

  let model: tf.Sequential | tf.LayersModel | null = null;

  if (modelId) {
    model = (await tf.loadLayersModel('file://' + path.join(getModelDir(modelId), 'model.json'))) as tf.LayersModel;
  } else if (modelPath) {
    model = (await tf.loadLayersModel(modelPath) as tf.LayersModel);
  } else {
    const trainableLayers = [ 'denseModified', 'conv_pw_13_bn', 'conv_pw_13', 'conv_dw_13_bn', 'conv _dw_13' ];
    const mobilenet = await
    tf.loadLayersModel('http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/models/mobilenet/model.json');
    const newInputLayer = tf.input({ shape: inputShape });
    const output = applyModel(newInputLayer, mobilenet);
    const predictions = tf.layers.dense({ units: outputShape, activation: 'softmax', name: 'denseModified' }).apply(output) as tf.SymbolicTensor;
    let mobilenetModified = tf.model({ inputs: newInputLayer, outputs: predictions, name: 'modelModified' });
    if (isFreeze) {
      mobilenetModified = freezeModelLayers(trainableLayers, mobilenetModified);
    }
    model = mobilenetModified;
  }
    
  model.compile({
    optimizer: optimizer,
    loss: loss,
    metrics: metrics
  });

  const result: TfJsLayersModel = {
    model,
    metrics: metrics,
    predict: function (inputData: tf.Tensor<any>) {
      const predictResultArray = this.model.predict(inputData);
      return predictResultArray;
    }
  };
  return result;
};

export default localMobileNetModelLoad;
