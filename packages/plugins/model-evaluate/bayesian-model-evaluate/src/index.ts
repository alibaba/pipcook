import {ModelEvaluateType, PipcookModel, CsvDataset, EvaluateResult, CsvDataLoader, CsvMetaData, ArgsType} from '@pipcook/pipcook-core';
import * as path from 'path';

const boa = require('@pipcook/boa');
const sys = boa.import('sys');
sys.path.insert(0, '/Users/queyue/Documents/work/pipcook/pipcook/pipcook_venv/lib/python3.7/site-packages');

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

const bayesianModelEvaluate: ModelEvaluateType 
  = async (data: CsvDataset, model: PipcookModel, args: ArgsType): Promise<EvaluateResult> => {

    sys.path.insert(0, path.join(__dirname, 'assets'));
    const module = boa.import('script');
    const importlib = boa.import('importlib');
    importlib.reload(module);
  
    const {modelDir} = args;
    const {testLoader, metaData} = data;
    const classifier = model.model;

    const {rawData, rawClass} = await createDataset(testLoader, metaData);
    const {TextProcessing, TextFeatures, get_all_words_list} = boa.import('script');
    const text_list = TextProcessing(rawData, rawClass);

    const feature_words = get_all_words_list(path.join(modelDir, 'feature_words.pkl'))
    const feature_list = TextFeatures(text_list[1], feature_words);
    const test_accuracy = classifier.score(feature_list, text_list[2]);
    return {
      accuracy: test_accuracy
    }
  };

export default bayesianModelEvaluate;
