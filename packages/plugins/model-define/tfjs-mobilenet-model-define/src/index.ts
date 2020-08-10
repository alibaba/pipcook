import { ModelDefineType, ImageSample, ImageDataset, ModelDefineArgsType, UniModel } from '@pipcook/pipcook-core';
import * as tf from '@tensorflow/tfjs-node-gpu';
import * as assert from 'assert';
import Jimp from 'jimp';

const MOBILENET_MODEL_PATH = 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/pipcook/models/mobilenet/web_model/model.json';

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
 * this is the plugin used to load a mobilenet model or load existing model.
 * @param optimizer (string | tf.train.Optimizer)[optional / default = tf.train.adam()] the optimizer of model
 * @param loss (string | string [] | {[outputName: string]: string} | LossOrMetricFn | LossOrMetricFn [] | {[outputName: string]: LossOrMetricFn}) \
 * [optional / default = 'categoricalCrossentropy'] the loss function of model
 * @param metrics (string | LossOrMetricFn | Array | {[outputName: string]: string | LossOrMetricFn}): [optional / default = ['accuracy']]
 * @param hiddenLayerUnits (number): [optional / default = 10]
*/
const mobilenetModelDefine: ModelDefineType = async (data: ImageDataset, args: ModelDefineArgsType): Promise<UniModel> => {
  let {
    optimizer = tf.train.adam(),
    loss = 'categoricalCrossentropy',
    metrics = [ 'accuracy' ],
    hiddenLayerUnits = 10,
    labelMap
  } = args;

  await data.trainLoader.next();
  assertionTest(data);
  const NUM_CLASSES = Object.keys(data.metadata.labelMap).length;
  labelMap = data.metadata.labelMap;

  let model: tf.LayersModel | null = null;

  const localModel = tf.sequential();
  const mobilenet = await tf.loadLayersModel(MOBILENET_MODEL_PATH);
  const layer = mobilenet.getLayer('conv_pw_13_relu');
  const truncatedMobilenet = tf.model({
    inputs: mobilenet.inputs,
    outputs: layer.output
  });
  for (const _layer of truncatedMobilenet.layers) {
    _layer.trainable = false;
  }
  localModel.add(truncatedMobilenet);
  localModel.add(tf.layers.flatten({
    inputShape: layer.outputShape.slice(1) as tf.Shape
  }));
  localModel.add(tf.layers.dense({
    units: hiddenLayerUnits,
    activation: 'relu'
  }));
  localModel.add(tf.layers.dense({
    units: NUM_CLASSES,
    activation: 'softmax'
  }));

  model = localModel as tf.LayersModel;

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

export default mobilenetModelDefine;
