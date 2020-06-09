import { ModelTrainType, UniModel, CsvDataset, ModelTrainArgsType } from '@pipcook/pipcook-core';
const boa = require('@pipcook/boa');

const train: ModelTrainType = async (dataset: CsvDataset, model: UniModel, args: ModelTrainArgsType): Promise<UniModel> => {
  const { modelPath, epochs = 10, lr = 1.0, wordNgrams = 2 } = args;
  const fasttext = boa.import('fasttext');

  if (dataset.trainCsvPath) {
    model.model = fasttext.train_supervised(boa.kwargs({
      input: dataset.trainCsvPath,
      epoch: epochs,
      lr,
      wordNgrams
    }));
    model.model.save_model(`${modelPath}/model.bin`);
  }
  return model;
};

export default train;
