/**
 * @file This is for the plugin to load Bayes Classifier model.
 */

import { CsvSample, ModelInferenceType } from '@pipcook/pipcook-core';
import { join } from 'path';
import { processPredictData, loadModel } from './script';

const boa = require('@pipcook/boa');
const sys = boa.import('sys');

/**
 * The inference model.
 * @param recoverPath The model path to be recovered.
 */
const inference: ModelInferenceType = async (recoverPath: string): Promise<any> => {
  sys.path.insert(0, join(__dirname, 'assets'));
  const model = await loadModel(join(recoverPath, 'model.pkl'));
  const featurePath = join(recoverPath, 'feature_words.pkl');
  const stopwordsPath = join(recoverPath, 'stopwords.txt');

  return async (text: CsvSample) => {
    const processData = await processPredictData(text.data, featurePath, stopwordsPath);
    return model.predict(processData).toString();
  };
};

export default inference;
