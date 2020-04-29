import { ModelEvaluateType, UniModel, CsvDataset, EvaluateResult, CsvDataLoader, CsvMetadata, ArgsType } from '@pipcook/pipcook-core';
import * as path from 'path';
import { TextProcessing, TextFeatures, get_all_words_list } from './script';

const boa = require('@pipcook/boa');
const sys = boa.import('sys');

const createDataset = async (dataLoader: CsvDataLoader, metadata: CsvMetadata) => {
  const rawData: any[] = [];
  const rawClass: any[] = [];

  const count = await dataLoader.len();
  for (let i = 0; i < count; i++) {
    const data = await dataLoader.getItem(i);
    rawData.push(data.data[metadata.feature.names[0]]);
    rawClass.push(data.label);
  }

  return { rawData, rawClass };
};

const bayesianModelEvaluate: ModelEvaluateType 
  = async (data: CsvDataset, model: UniModel, args: ArgsType): Promise<EvaluateResult> => {

    sys.path.insert(0, path.join(__dirname, 'assets'));

    const { modelDir, expectAccuracy = 0.95 } = args;
    const { testLoader, metadata } = data;
    const classifier = model.model;

    const { rawData, rawClass } = await createDataset(testLoader, metadata);
    const text_list = TextProcessing(rawData, rawClass);

    const feature_words = get_all_words_list(path.join(modelDir, 'feature_words.pkl'));
    const feature_list = TextFeatures(text_list[1], feature_words);
    const accuracy = classifier.score(feature_list, text_list[2]);
    return {
      pass: accuracy >= parseInt(expectAccuracy),
      accuracy
    };
  };

export default bayesianModelEvaluate;
