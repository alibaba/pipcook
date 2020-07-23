import {
  ModelDefineType,
  UniDataset,
  ModelDefineArgsType,
  UniModel,
  Sample
} from '@pipcook/pipcook-core';

const templateModelDefine: ModelDefineType = async (data: UniDataset, args: ModelDefineArgsType): Promise <UniModel> => {

  let model = {}; // Some model defination

  const retModelDefine: UniModel = {
    model,
    predict: async function (input: Sample) {
      const pred = this.model.predict(input.data);
      return pred.toString();
    }
  };
  return retModelDefine;
};

export default templateModelDefine;
