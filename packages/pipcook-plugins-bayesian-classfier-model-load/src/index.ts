/**
 * @file This is for the plugin to load Bayes Classifier model.
 */

import {ModelLoadType, PipcookModel, UniformSampleData, ModelLoadArgsType, getModelDir} from '@pipcook/pipcook-core';
import * as tf from '@tensorflow/tfjs-node-gpu';
import * as assert from 'assert';
const bayes = require('bayes');
import * as fs from 'fs';

/**
 * assertion test
 * @param data 
 */
const assertionTest = (data: UniformSampleData) => {
  assert.ok(data.metaData.feature && data.metaData.feature.shape 
    && data.metaData.feature.shape.length === 1, 'feature should only have one dimension which is the feature name');
  assert.ok(data.metaData.label && data.metaData.label.shape 
    && data.metaData.label.shape.length === 1, 'Label should only have one dimension which is the label name');
}

/**
 * Pipcook Plugin: bayes classifier model
 * @param data Pipcook uniform sample data
 * @param args args. If the model path is provided, it will restore the model previously saved
 */
const bayesianClassifierModelLoad: ModelLoadType = async (data: UniformSampleData, args?: ModelLoadArgsType): Promise<PipcookModel> => {
  assert.ok(args && args.modelName, 'Please provide the unique model name to identify');
  const {
    modelId='',
  } = args || {};
  if (!modelId) {
    assertionTest(data);
  }
  let classifier = bayes();
  if (modelId) {
    const json = fs.readFileSync(getModelDir(modelId));
    classifier = classifier.fromJSON(json);
  }
  const result: PipcookModel = {
    model: classifier,
    type: 'text classification',
    inputShape: [1],
    inputType: 'string',
    outputShape: [1],
    outputType: 'string',
    save: function(modelPath: string) {
      const json = this.model.toJson();
      fs.writeFileSync(modelPath, json);
    },
    predict: function(data: tf.Tensor<any>) {
      assert.ok(data.shape[0] === 1)
      const input = data.dataSync()[0];
      const output = this.model.categorize(input);
      return output;
    }, 
    modelName: (<string>(args.modelName))
  }
  return result;
}

export default bayesianClassifierModelLoad;