/**
 * @file This plugin is used to load the mobileNet for image classification. The input layer is modified to fit into any shape of input.
 * The final layer is changed to a softmax layer to match the output shape
 */

import { ModelLoadType, UniDataset, ModelDefineArgsType, UniModel, Sample } from '@pipcook/pipcook-core';

const boa = require('@pipcook/boa');
const tf = boa.import('tensorflow');

const tensorflowModelLoad: ModelLoadType = async (data: UniDataset, args: ModelDefineArgsType): Promise<UniModel> => {
  let {
    recoverPath
  } = args;

  const model = tf.keras.models.load_model(recoverPath);

  return {
    model,
    predict: async function (inputData: Sample) {
      return this.model.predict(inputData.data);
    }
  };
};

export default tensorflowModelLoad;
