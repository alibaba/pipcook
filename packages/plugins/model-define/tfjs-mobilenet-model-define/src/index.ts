/**
 * @file This plugin is used to load the moblieNet for iamge classification. The input layer is modified to fit into any shape of input.
 * The final layer is changed to a softmax layer to match the output shape
 */

import { ModelDefineType, ImageDataset, getModelDir, getMetadata, ModelDefineArgsType, TfJsLayersModel } from '@pipcook/pipcook-core';
import * as tf from '@tensorflow/tfjs-node-gpu';
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import Jimp from 'jimp';

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
  assert.ok(data.metadata.feature, 'Image feature is missing');
  assert.ok(data.metadata.feature.shape.length === 3, 'The size of an image must be 3d');
};

function argMax(array: any) {
  return [].map.call(array, (x: any, i: any) => [ x, i ]).reduce((r: any, a: any) => (a[0] > r[0] ? a : r))[1];
}


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
const localMobileNetModelDefine: ModelDefineType = async (data: ImageDataset, args: ModelDefineArgsType): Promise<TfJsLayersModel> => {
  let {
    optimizer = tf.train.rmsprop(0.00005, 1e-7),
    loss = 'categoricalCrossentropy',
    metrics = [ 'accuracy' ],
    isFreeze = true,
    recoverPath,
    outputShape,
    labelMap
  } = args;

  let inputShape: number[];

  if (!recoverPath) {
    assertionTest(data);
    inputShape = data.metadata.feature.shape;
    outputShape = Object.keys(data.metadata.labelMap).length;
    labelMap = data.metadata.labelMap;
  } else {
    const log = JSON.parse(fs.readFileSync(path.join(recoverPath, 'log.json'), 'utf8'));
    outputShape = Object.keys(log.metadata.labelMap).length;
  }

  let model: tf.Sequential | tf.LayersModel | null = null;

  if (recoverPath) {
    model = (await tf.loadLayersModel('file://' + path.join(recoverPath, 'model', 'model.json'))) as tf.LayersModel;
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
  model.summary();
  model.compile({
    optimizer: optimizer,
    loss: loss,
    metrics: metrics
  });

  const result: TfJsLayersModel = {
    model,
    metrics: metrics,
    predict: async function (inputData: string[]) {
      const prediction = [];
      for (let i = 0; i < inputData.length; i++) {
        const image = await Jimp.read(inputData[i]);
        const trainImageBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);
        const imageArray = new Uint8Array(trainImageBuffer);
        const imgTensor = tf.node.decodeImage(imageArray, 3);
        const predictResultArray = this.model.predict(imgTensor.expandDims(0));
        const index = argMax(predictResultArray.dataSync());
        if (labelMap) {
          for (let key in labelMap) {
            if (labelMap[key] === index) {
              prediction.push(key);
            }
          }
        } else {
          prediction.push(predictResultArray);
        }
      } 
      return prediction;
    }
  };
  return result;
};

export default localMobileNetModelDefine;
