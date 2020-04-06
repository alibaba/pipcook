/**
 * @file this is for Pipcook plugin to train Bayes Classifier.
 */
import {ModelTrainType, PipcookModel, CsvDataset, ModelTrainArgsType, CsvDataLoader, CsvMetaData} from '@pipcook/pipcook-core';
import * as path from 'path';
import * as fs from 'fs-extra';

const boa = require('@pipcook/boa');
const sys = boa.import('sys');

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
    saveModel,
    mode = 'cn'
  } = args;

  sys.path.insert(0, path.join(__dirname,  'assets'));
  const module = boa.import('script');
  const importlib = boa.import('importlib');
  importlib.reload(module);

  const { trainLoader, metaData } = data;
  
  const classifier = model.model;
  
  const {rawData, rawClass} = await createDataset(trainLoader, metaData);

  const {TextProcessing, MakeWordsSet, words_dict, TextFeatures, save_all_words_list, saveBayesModel} = boa.import('script');
  const text_list = TextProcessing(rawData, rawClass);

  let stoppath = '';
  if (mode === 'en') {
    stoppath = path.join(__dirname, 'assets', 'stopwords_en.txt');
  } else {
    stoppath = path.join(__dirname, 'assets', 'stopwords_cn.txt');
  }

  const stopwords_set = MakeWordsSet(stoppath);
  const feature_words = words_dict(text_list[0], stopwords_set);
  const feature_list = TextFeatures(text_list[1], feature_words);
  classifier.fit(feature_list, text_list[2]);

  await saveModel(async (modelPath: string) => {
    await fs.copySync(stoppath, path.join(modelPath, 'stopwords.txt'));
    save_all_words_list(feature_words, path.join(modelPath, 'feature_words.pkl'));
    saveBayesModel(classifier, path.join(modelPath, 'model.pkl'));
  });

  return model;

};

export default bayesianClassifierModelTrain;

