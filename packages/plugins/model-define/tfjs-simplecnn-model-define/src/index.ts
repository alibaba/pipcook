import { ModelDefineType, ImageSample, ImageDataset, ModelDefineArgsType, UniModel } from '@pipcook/pipcook-core';
import * as tf from '@tensorflow/tfjs-node-gpu';
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import Jimp from 'jimp';

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
 * this is the plugin used to load a simple cnn model or load existing model.
 * @param optimizer (string | tf.train.Optimizer)[optional / default = tf.train.rmsprop(0.00005, 1e-7)] the optimizer of model
 * @param loss (string | string [] | {[outputName: string]: string} | LossOrMetricFn | LossOrMetricFn [] | {[outputName: string]: LossOrMetricFn}) \
 * [optional / default = 'categoricalCrossentropy'] the loss function of model
 * @param metrics (string | LossOrMetricFn | Array | {[outputName: string]: string | LossOrMetricFn}): [optional / default = ['accuracy']] \
 * the evaluation metrics of model during training
 * @param modelId (string)[optional] if you want to load a model from previously trained pipcook pipeline, give the pipeline id here
 * @param modelPath (string)[optional] if you want to load a model from a local file path, give the path here
 */
const simpleCnnModelDefine: ModelDefineType = async (data: ImageDataset, args: ModelDefineArgsType): Promise<UniModel> => {
  let {
    optimizer = tf.train.rmsprop(0.00005, 1e-7),
    loss = 'categoricalCrossentropy',
    metrics = [ 'accuracy' ],
    recoverPath,
    outputShape,
    labelMap
  } = args;

  let inputShape: number[];

  // create a new model
  if (!recoverPath) {
    await data.trainLoader.next();
    assertionTest(data);
    inputShape = data.metadata.feature.shape;
    outputShape = Object.keys(data.metadata.labelMap).length;
    labelMap = data.metadata.labelMap;
  } else {
    const log = JSON.parse(fs.readFileSync(path.join(recoverPath, '..', 'metadata.json'), 'utf8'));
    labelMap = JSON.parse(log.output.dataset).labelMap;
    outputShape = Object.keys(labelMap).length;
  }

  let model: tf.LayersModel | null = null;
  // load from former pipcook trained model
  if (recoverPath) {
    model = (await tf.loadLayersModel('file://' + path.join(recoverPath, 'model.json'))) as tf.LayersModel;
  } else {
    const localModel = tf.sequential();
    localModel.add(tf.layers.conv2d({
      inputShape: inputShape,
      filters: 32,
      kernelSize: 3,
      activation: 'relu',
      kernelInitializer: 'glorotUniform',
      padding: 'same'
    }));
    localModel.add(tf.layers.conv2d({
      filters: 32,
      kernelSize: 3,
      activation: 'relu',
      kernelInitializer: 'glorotUniform'
    }));
    localModel.add(tf.layers.maxPooling2d({ poolSize: [ 2, 2 ] }));
    localModel.add(tf.layers.dropout({ rate: 0.25 }));
    localModel.add(tf.layers.conv2d({
      filters: 64,
      kernelSize: 3,
      activation: 'relu',
      kernelInitializer: 'glorotUniform',
      padding: 'same'
    }));
    localModel.add(tf.layers.conv2d({
      filters: 64,
      kernelSize: 3,
      activation: 'relu',
      kernelInitializer: 'glorotUniform'
    }));
    localModel.add(tf.layers.maxPooling2d({ poolSize: [ 2, 2 ] }));
    localModel.add(tf.layers.dropout({ rate: 0.25 }));
    localModel.add(tf.layers.flatten());
    localModel.add(tf.layers.dense({ units: 512, activation: 'relu', kernelInitializer: 'glorotUniform' }));
    localModel.add(tf.layers.dropout({ rate: 0.5 }));
    localModel.add(tf.layers.dense({ units: outputShape, activation: 'softmax', kernelInitializer: 'glorotUniform' }));

    model = localModel as tf.LayersModel;
  }

  model.compile({
    optimizer,
    loss,
    metrics
  });

  return {
    model,
    metrics,
    predict: async function (inputData: ImageSample) {
      let predict: any;
      const image = await Jimp.read(inputData.data);
      const trainImageBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);
      const imageArray = new Uint8Array(trainImageBuffer);
      const imgTensor = tf.node.decodeImage(imageArray, 3);
      const predictResultArray = this.model.predict(imgTensor.expandDims(0));
      const index = argMax(predictResultArray.dataSync());
      if (labelMap) {
        for (let key in labelMap) {
          if (labelMap[key] === index) {
            predict = key;
          }
        }
      } else {
        predict = predictResultArray;
      }
      return predict;
    }
  };
};

export default simpleCnnModelDefine;
