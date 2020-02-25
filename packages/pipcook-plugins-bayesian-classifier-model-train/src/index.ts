/**
 * @file this is for Pipcook plugin to train Bayes Classifier.
 */
import {ModelTrainType, PipcookModel, UniformTfSampleData, MetaData} from '@pipcook/pipcook-core';
import * as tf from '@tensorflow/tfjs-node-gpu';
import * as assert from 'assert';
const _cliProgress = require('cli-progress');

/**
 * assertion test
 * @param data 
 */
const assertionTest = (data: UniformTfSampleData, trainData: tf.data.Dataset<{ xs: tf.Tensor<any>; ys?: tf.Tensor<any> }>, metaData: MetaData) => {
  assert.ok(data.metaData.feature && data.metaData.feature.shape 
    && data.metaData.feature.shape.length === 1, 'feature should only have one dimension which is the feature name');
  assert.ok(data.metaData.label && data.metaData.label.shape 
    && data.metaData.label.shape.length === 1, 'Label should only have one dimension which is the label name');
  assert.ok(metaData.feature && metaData.label.name, 'data should have feature');
  assert.ok(metaData.label && metaData.label.name, 'data should have label');
  assert.ok(trainData != null, 'The train data cannot be empty');
}

/**
 * 
 * @param data Pipcook uniform data 
 * @param model Eshcer model
 */
const bayesianClassifierModelTrain: ModelTrainType = async (data: UniformTfSampleData, model: PipcookModel): Promise<PipcookModel> => {
  const {trainData, metaData} = data;
  assertionTest(data, trainData, metaData);
  
  const trainModel = model.model;

  let count = 0;
  await trainData.forEachAsync((e: any) => {
    count++;
  });
  const bar1 = new _cliProgress.SingleBar({}, _cliProgress.Presets.shades_classic);
  bar1.start(count, 0);
  count = 0;
  await trainData.forEachAsync((e: any) => {
    count = count + 1;
    bar1.update(count);
    const trainX = e[metaData.feature.name].dataSync()[0];
    const trainY = e[metaData.label.name].dataSync()[0];
    trainModel.learn(trainX, trainY);
  });
  bar1.stop();

  return {
    ...model,
    model: trainModel
  }
}

export default bayesianClassifierModelTrain;

