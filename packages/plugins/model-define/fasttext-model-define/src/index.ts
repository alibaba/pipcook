import { ModelDefineType, UniModel, ModelDefineArgsType, CsvSample, CsvDataset } from '@pipcook/pipcook-core';
const boa = require('@pipcook/boa');

const defineFastText: ModelDefineType = async (dataset: CsvDataset, args: ModelDefineArgsType): Promise<UniModel> => {
  const { recoverPath } = args;
  const fasttext = boa.import('fasttext');
  let model: any;

  if (recoverPath) {
    model = fasttext.load_model(`${recoverPath}/model.bin`);
  }

  return {
    model: null,
    predict: function (sample: CsvSample) {
      if (model == null) {
        throw new TypeError('no recoverPath specified.');
      }
      return model.predict(sample.data);
    }
  } as UniModel;
};

export default defineFastText;
