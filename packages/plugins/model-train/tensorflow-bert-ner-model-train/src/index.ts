import { ModelTrainType, UniModel, ImageDataset, ModelTrainArgsType } from '@pipcook/pipcook-core';
import * as path from 'path';

const boa = require('@pipcook/boa');
const sys = boa.import('sys');
sys.path.insert(0, path.join(__dirname, '..'));
const { train } = boa.import('bert_ner_train.index');

const bertNerModelTrain: ModelTrainType = async (data: ImageDataset, model: UniModel, args: ModelTrainArgsType): Promise<UniModel> => {
  const {
    epochs = 10,
    batchSize = 16,
    modelPath
  } = args;
  train({
    ner: model.model,
    ...model.config,
    data_dir: '/Users/queyue/Documents/work/pipcook/BERT-NER-TF/data',
    output_dir: '/Users/queyue/Documents/work/pipcook/output-ner',
    train_batch_size: 8,
    num_train_epochs: 10,
  })

  return null as any;
};

export default bertNerModelTrain;
