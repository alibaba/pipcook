/**
 * @file This plugin is used to load the moblieNet for iamge classification. The input layer is modified to fit into any shape of input.
 * The final layer is changed to a softmax layer to match the output shape
 */

import {ModelLoadType, PipcookModel, UniformTfSampleData, getModelDir, getMetadata} from '@pipcook/pipcook-core';
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
    if (layer.name.indexOf(tobeTrained) === 0)
     {
      layer.trainable = true;
      break;
     }
   }
  }
 return mobilenetModified;
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
}

/**
 *  main function of the operator: load the mobilenet model
 * @param data sample data
 */
const localMobileNetModelLoad: ModelLoadType = async (data: UniformTfSampleData, args?: any): Promise<PipcookModel> => {
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
      outputShape = data.metaData.label.shape || [0];
    }

    let model: tf.Sequential | tf.LayersModel | null = null;
    if (modelId) {
      model = <tf.Sequential>(await tf.loadLayersModel('file://' + path.join(getModelDir(modelId), 'model.json')));
      const metaData = getMetadata(modelId);
      data = <UniformTfSampleData>{metaData};
    } else {
      const trainableLayers = ['denseModified','conv_pw_13_bn','conv_pw_13','conv_dw_13_bn','conv _dw_13'];
      const mobilenet = await
        tf.loadLayersModel('https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json');
      const newInputLayer = tf.input({shape: inputShape});
      const output = applyModel(newInputLayer, mobilenet);
      const predictions = <tf.SymbolicTensor> tf.layers.dense({units: outputShape[1],  activation: 'softmax', name: 'denseModified'}).apply(output); 
      let mobilenetModified = tf.model({inputs: newInputLayer, outputs: predictions, name: 'modelModified' });
      mobilenetModified = freezeModelLayers(trainableLayers, mobilenetModified);
      model = mobilenetModified;
    }
    
    model.compile({
      optimizer: optimizer,
      loss: loss,
      metrics: metrics
    });
    return {
      model: model,
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
        const predictResultArray = (this.model.predict(inputData)).arraySync();
        const result = predictResultArray.map((predictResult: any[]) => {
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
        })
        return result; 
      },
      modelName: (<string>(args.modelName))
    }

}

export default localMobileNetModelLoad;