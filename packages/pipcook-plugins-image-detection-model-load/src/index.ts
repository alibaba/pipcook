/**
 * @file This plugin is used to load the moblieNet for iamge classification. The input layer is modified to fit into any shape of input.
 * The final layer is changed to a softmax layer to match the output shape
 */

import {ModelLoadType, PipcookModel, UniformTfSampleData, getModelDir, getMetadata} from '@pipcook/pipcook-core';
import * as tf from '@tensorflow/tfjs-node-gpu';
import * as assert from 'assert';
import * as path from 'path';

const INPUT_SIZE = 224;  // input size of MobileNet.

const MAX_BBOX = 10;
const NUM_CLASS = 2;


const topLayerGroupNames = ['conv_pw_9', 'conv_pw_10', 'conv_pw_11'];

// Name of the layer that will become the top layer of the truncated base.
const topLayerName =
    `${topLayerGroupNames[topLayerGroupNames.length - 1]}_relu`;

// Used to scale the first column (0-1 shape indicator) of `yTrue`
// in order to ensure balanced contributions to the final loss value
// from shape and bounding-box predictions.
const LABEL_MULTIPLIER = new Array(MAX_BBOX * 5).fill(1);

for(let i = 0; i < LABEL_MULTIPLIER.length;i+=5) {
  LABEL_MULTIPLIER[i] = LABEL_MULTIPLIER[i] * 1.0 * INPUT_SIZE / NUM_CLASS;
}

/**
 * Custom loss function for object detection.
 *
 * The loss function is a sum of two losses
 * - shape-class loss, computed as binaryCrossentropy and scaled by
 *   `classLossMultiplier` to match the scale of the bounding-box loss
 *   approximatey.
 * - bounding-box loss, computed as the meanSquaredError between the
 *   true and predicted bounding boxes.
 * @param {tf.Tensor} yTrue True labels. Shape: [batchSize, 5].
 *   The first column is a 0-1 indicator for whether the shape is a triangle
 *   (0) or a rectangle (1). The remaining for columns are the bounding boxes
 *   for the target shape: [left, right, top, bottom], in unit of pixels.
 *   The bounding box values are in the range [0, CANVAS_SIZE).
 * @param {tf.Tensor} yPred Predicted labels. Shape: the same as `yTrue`.
 * @return {tf.Tensor} Loss scalar.
 */
function customLossFunction(yTrue: any, yPred: any) {
  return tf.tidy(() => {
    // Scale the the first column (0-1 shape indicator) of `yTrue` in order
    // to ensure balanced contributions to the final loss value
    // from shape and bounding-box predictions.
    return tf.metrics.meanSquaredError(yTrue.mul(LABEL_MULTIPLIER), yPred);
  });
}

/**
 * Loads MobileNet, removes the top part, and freeze all the layers.
 *
 * The top removal and layer freezing are preparation for transfer learning.
 *
 * Also gets handles to the layers that will be unfrozen during the fine-tuning
 * phase of the training.
 *
 * @return {tf.Model} The truncated MobileNet, with all layers frozen.
 */
async function loadTruncatedBase() {
  // TODO(cais): Add unit test.
  const mobilenet = await tf.loadLayersModel(
      'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json');

  // Return a model that outputs an internal activation.
  const fineTuningLayers = [];
  const layer = mobilenet.getLayer(topLayerName);
  const truncatedBase =
      tf.model({inputs: mobilenet.inputs, outputs: layer.output});
  // Freeze the model's layers.
  for (const layer of truncatedBase.layers) {
    layer.trainable = false;
    for (const groupName of topLayerGroupNames) {
      if (layer.name.indexOf(groupName) === 0) {
        fineTuningLayers.push(layer);
        break;
      }
    }
  }
  return {truncatedBase, fineTuningLayers};
}

/**
 * Build a new head (i.e., output sub-model) that will be connected to
 * the top of the truncated base for object detection.
 *
 * @param {tf.Shape} inputShape Input shape of the new model.
 * @returns {tf.Model} The new head model.
 */
function buildNewHead(inputShape: number[]) {
  const newHead = tf.sequential();
  newHead.add(tf.layers.flatten({inputShape}));
  newHead.add(tf.layers.dense({units: 200, activation: 'relu'}));
  // Five output units:
  //   - The first is a shape indictor: predicts whether the target
  //     shape is a triangle or a rectangle.
  //   - The remaining four units are for bounding-box prediction:
  //     [left, right, top, bottom] in the unit of pixels.
  newHead.add(tf.layers.dense({units: 5 * MAX_BBOX}));
  return newHead;
}

/**
 * Builds object-detection model from MobileNet.
 *
 * @returns {[tf.Model, tf.layers.Layer[]]}
 *   1. The newly-built model for simple object detection.
 *   2. The layers that can be unfrozen during fine-tuning.
 */
async function buildObjectDetectionModel() {
  const {truncatedBase, fineTuningLayers} = await loadTruncatedBase();

  // Build the new head model.
  const newHead = buildNewHead(truncatedBase.outputs[0].shape.slice(1));
  const newOutput = newHead.apply(truncatedBase.outputs[0]);
  const model = tf.model({inputs: truncatedBase.inputs, outputs: <tf.SymbolicTensor | tf.SymbolicTensor[]>newOutput});

  return {model, fineTuningLayers};
}

/**
 * assertion test
 * @param data 
 */
const assertionTest = (data: UniformTfSampleData) => {
  assert.ok(data.metaData.feature, 'Image feature is missing');
  assert.ok(data.metaData.feature.shape.length === 3, 'The size of an image must be 2d or 3d');
  assert.ok(data.metaData.label.shape && data.metaData.label.shape.length == 2, 'The label vector should be a one hot vector');
}

const imageDetectionModelLoad: ModelLoadType = async (data: UniformTfSampleData, args?: any): Promise<PipcookModel> => {
  const {
    optimizer = tf.train.rmsprop(5e-3),
    modelId=''
  } = args || {};

  if (!modelId) {
    assert.ok(args && args.modelName, 'Please give your model a name');
  }
  
  let model: tf.Sequential | tf.LayersModel | null = null;
  if (modelId) {
    model = <tf.Sequential>(await tf.loadLayersModel('file://' + path.join(getModelDir(modelId), 'model.json')));
    const metaData = getMetadata(modelId);
    data = <UniformTfSampleData>{metaData};
  } else {
    const {model: odModel, fineTuningLayers} = await buildObjectDetectionModel();
    for (const layer of fineTuningLayers) {
      layer.trainable = true;
    }
    model = odModel;
  }
  
  model.compile({loss: customLossFunction, optimizer});

  return {
    model,
    type: 'object detection',
    inputShape: [224, 224, 3],
    outputShape: [1, 5 * MAX_BBOX],
    inputType: 'float32',
    outputType: 'int32',
    metrics: [],
    save: async function(modelPath: string) {
      await this.model.save('file://' + modelPath);
    },
    predict: function (inputData: tf.Tensor<any>) {
      const predictResult = (this.model.predict(inputData)).dataSync();
      const finalResult = [];
      const valueMap = data.metaData.label.valueMap
      for (let i = 0; i < predictResult.length; i = i + 5) {
        let index = Math.round(predictResult[i]);
        let prop: any = -1;
        for (let key in valueMap) {
          if (valueMap[key] === index) {
            prop = key;
          }
        }
        if (prop === -1) continue;
        const item: any = {size: this.inputShape, object: {name: prop, bndbox: {}}};
        for (let j = 1; j < 5; j++) {
          let currentValue = predictResult[i + j];
          const maxValue = j < 3 ? this.inputShape[0] : this.inputShape[1];
          if (currentValue < 0) currentValue = 0;
          if (currentValue > maxValue) currentValue = maxValue;
          if (j === 1) item.object.bndbox.xmin = currentValue;
          if (j === 1) item.object.bndbox.xmax = currentValue;
          if (j === 1) item.object.bndbox.ymin = currentValue;
          if (j === 1) item.object.bndbox.ymax = currentValue;
        }
        finalResult.push(item);
      }
      return finalResult;
    },
    modelName: (<string>(args.modelName))
  }
}

export default imageDetectionModelLoad;