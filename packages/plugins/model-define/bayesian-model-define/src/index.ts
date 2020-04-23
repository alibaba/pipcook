/**
 * @file This is for the plugin to load Bayes Classifier model.
 */

import { ModelDefineType, UniModel, ModelDefineArgsType, CsvDataset, CsvSample } from '@pipcook/pipcook-core';
import * as assert from 'assert';
import * as path from 'path';
import { processPredictData, getBayesModel, loadModel } from './script';

const boa = require('@pipcook/boa');
const sys = boa.import('sys');

/**
 * assertion test
 * @param data 
 */
const assertionTest = (data: CsvDataset) => {
  assert.ok(data.metadata.feature && data.metadata.feature.names.length === 1, 
    'feature should only have one dimension which is the feature name');
};

/**
 * Pipcook Plugin: bayes classifier model
 * @param data Pipcook uniform sample data
 * @param args args. If the model path is provided, it will restore the model previously saved
 */
const bayesianClassifierModelDefine: ModelDefineType = async (data: CsvDataset, args: ModelDefineArgsType): Promise<UniModel> => {
  const {
    recoverPath
  } = args;

  sys.path.insert(0, path.join(__dirname, 'assets'));
  let classifier: any;

  if (!recoverPath) {
    assertionTest(data);
    classifier = getBayesModel();
  } else {
    classifier = loadModel(path.join(recoverPath, 'model', 'model.pkl'));
  }
  
  const pipcookModel: UniModel = {
    model: classifier,
    predict: async function (text: CsvSample) {
      const processData = await processPredictData(text.data, path.join(recoverPath, 'model', 'feature_words.pkl'), path.join(recoverPath, 'model', 'stopwords.txt'));
      const pred = this.model.predict(processData);
      return pred.toString();
    }
  };
  return pipcookModel;
};

export default bayesianClassifierModelDefine;
