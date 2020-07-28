import { ModelTrainType, UniModel, CsvDataset, ModelTrainArgsType } from '@pipcook/pipcook-core';
import * as path from 'path';

const boa = require('@pipcook/boa');
const sys = boa.import('sys');
sys.path.insert(0, path.join(__dirname, '..'));
const { train } = boa.import('bert_ner_train.index');

const bertNerModelTrain: ModelTrainType = async (data: CsvDataset, model: UniModel, args: ModelTrainArgsType): Promise<UniModel> => {
  const {
    epochs = 10,
    batchSize = 16,
    modelPath
  } = args;

  const { trainCsvPath } = data;

  train({
    ner: model.model,
    ...model.config,
    data_dir: trainCsvPath,
    output_dir: modelPath,
    train_batch_size: batchSize,
    num_train_epochs: epochs
  })

  return model;
};

export default bertNerModelTrain;
