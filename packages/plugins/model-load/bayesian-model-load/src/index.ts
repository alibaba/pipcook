/**
 * @file This is for the plugin to load Bayes Classifier model.
 */

import { ModelLoadType, PipcookModel, ModelLoadArgsType, getModelDir, CsvDataset } from '@pipcook/pipcook-core';
import * as assert from 'assert';
import * as path from 'path';

const boa = require('@pipcook/boa');
const sys = boa.import('sys');

/**
 * assertion test
 * @param data 
 */
const assertionTest = (data: CsvDataset) => {
  assert.ok(data.metaData.feature && data.metaData.feature.featureNames.length === 1, 
    'feature should only have one dimension which is the feature name');
};

/**
 * Pipcook Plugin: bayes classifier model
 * @param data Pipcook uniform sample data
 * @param args args. If the model path is provided, it will restore the model previously saved
 */
const bayesianClassifierModelLoad: ModelLoadType = async (data: CsvDataset, args: ModelLoadArgsType): Promise<PipcookModel> => {
  const {
    modelId = '',
    modelPath = '',
    pipelineId
  } = args;

  sys.path.insert(0, path.join(__dirname, 'assets'));
  
  const { loadModel, getBayesModel, processPredictData } = boa.import('script');
  let classifier: any;

  if (!modelId && !modelPath) {
    assertionTest(data);
    classifier = getBayesModel();
  }

  if (modelId) {
    classifier = loadModel(path.join(getModelDir(modelId), 'model.pkl'));
  }

  if (modelPath) {
    classifier = loadModel(modelPath);
  }
  
  const pipcookModel: PipcookModel = {
    model: classifier,
    predict: function (text: string) {
      const processData = processPredictData(text, path.join(getModelDir(pipelineId), 'feature_words.pkl'), path.join(getModelDir(pipelineId), 'stopwords.txt'));
      const prediction = this.model.predict(processData);
      return prediction;
    }
  };
  return pipcookModel;
};

export default bayesianClassifierModelLoad;
