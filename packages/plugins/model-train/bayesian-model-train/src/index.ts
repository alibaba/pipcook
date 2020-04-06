/**
 * @file this is for Pipcook plugin to train Bayes Classifier.
 */
import { ModelTrainType, PipcookModel, CsvDataset, ModelTrainArgsType, getModelDir, CsvDataLoader, CsvMetaData } from '@pipcook/pipcook-core';
import * as path from 'path';
import * as fs from 'fs';
import { Python } from '@pipcook/pipcook-python-node';

const boa = require('@pipcook/boa');
const sys = boa.import('sys');
sys.path.insert(0, '/Users/queyue/Documents/work/pipcook/pipcook/pipcook_venv/lib/python3.7/site-packages');
sys.path.insert(0, path.join(__dirname, '..', 'assets'));

const createDataset = async (dataLoader: CsvDataLoader, metaData: CsvMetaData) => {
  const rawData: any[] = [];
  const rawClass: any[] = [];

  const count = await dataLoader.len();
  for (let i = 0; i < count; i++) {
    const data = await dataLoader.getItem(i);
    rawData.push(data.data[metaData.feature.featureNames[0]]);
    rawClass.push(data.label);
  }

  return {rawData, rawClass};
}

/**
 * 
 * @param data Pipcook uniform data 
 * @param model Eshcer model
 */
const bayesianClassifierModelTrain: ModelTrainType = async (data: CsvDataset, model: PipcookModel, args: ModelTrainArgsType): Promise<PipcookModel> => {
  const { 
    pipelineId,
    mode = 'cn'
  } = args;

  const { trainLoader, metaData } = data;
  
  const classifier = model.model;
  
  const {rawData, rawClass} = await createDataset(trainLoader, metaData);

  const {TextProcessing, MakeWordsSet, words_dict, TextFeatures} = boa.import('script');
  const text_list = TextProcessing(rawData, rawClass, boa.kwargs({ test_size: 0.2 }));

  let stoppath = '';
  if (mode === 'en') {
    stoppath = path.join(__dirname, 'assets', 'stopwords_en.txt');
  } else {
    stoppath = path.join(__dirname, 'assets', 'stopwords_cn.txt');
  }

  const stopwords_set = MakeWordsSet(stoppath);
  const feature_words = words_dict(text_list[0], stopwords_set);
  const feature_list = TextFeatures(text_list[1], text_list[2], feature_words);
  classifier.fit(feature_list[0], text_list[3]);
};

export default bayesianClassifierModelTrain;

