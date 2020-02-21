/**
 * plugin to train model
 */

import {PipcookModel, UniformTfSampleData, ArgsType, ModelTrainType} from '@pipcook/pipcook-core';
import * as assert from 'assert';
import * as tf from '@tensorflow/tfjs-node-gpu';

/**
 * model for image claasifiaction
 * @param data : train data
 * @param model : model loaded before
 * @param epochs : need to specify epochs
 * @param batchSize : need to specify batch size
 * @param optimizer : need to specify optimizer
 */
const ModelTrain: ModelTrainType = async (data: UniformTfSampleData, model: PipcookModel, args?: ArgsType): Promise<PipcookModel> => {
  try {
    const {
      epochs = 10,
      batchSize = 32,
      shuffle = 100
    } = args || {};

    const metaData = data.metaData;
    assert.ok(metaData.feature && metaData.feature.name, 'data should have feature and feature name');
    assert.ok(metaData.label && metaData.label.name, 'data should have label');

    const trainData = data.trainData;
    let validationData: any;
    if (data.validationData) {
      validationData = data.validationData;
    }
    const ds = trainData.shuffle(shuffle).repeat().batch(batchSize);
    const trainModel = model.model;

    const trainConfig: any = {
      epochs: epochs,
      batchesPerEpoch: parseInt(String(data.trainData.size / batchSize))
    }

    if (validationData) {
      const validateDs = validationData.batch(batchSize);
      trainConfig.validationData = validateDs;
      trainConfig.validationBatches = parseInt(String((data.validationData as any).size / batchSize));
    }
    const history = await trainModel.fitDataset(ds, trainConfig);
    const result: PipcookModel = {
      model: trainModel,
      type: model.type,
      inputShape: model.inputShape,
      outputShape: model.outputShape,
      history,
      metrics: model.metrics || [],
      inputType: 'float32',
      outputType: 'int32',
      save: model.save,
      predict: model.predict,
    }
    return result;
  } catch (err) {
    console.log('[ERROR] model trainer', err);
    throw err;
  }
}

export default ModelTrain;