import { ImageDataset, ModelTrainType, UniModel, ModelTrainArgsType, ImageDataLoader } from '@pipcook/pipcook-core';
import * as path from 'path';

const boa = require('@pipcook/boa');
const { tuple } = boa.builtins();
const sys = boa.import('sys');
sys.path.insert(0, path.join(__dirname, '..', 'piploadlib'));
const loadImage = boa.import('loadimage');
const tf = boa.import('tensorflow');
const AUTOTUNE = tf.data.experimental.AUTOTUNE;

const config = tf.compat.v1.ConfigProto()
config.gpu_options.allow_growth = true
tf.compat.v1.InteractiveSession(boa.kwargs({
  config:config
}))

interface TrainConfig {
  epochs: number;
  steps_per_epoch: number;
  validation_data?: any;
  validation_steps?: number;
}

async function createDataset(dataLoader: ImageDataLoader, labelMap: Record<string, number>) {
  const imageNames: string[] = [];
  const labels: number[] = [];
  const count = await dataLoader.len();
  for (let i = 0; i < count; i++) {
    const currentData = await dataLoader.getItem(i);
    imageNames.push(currentData.data);
    labels.push(tf.one_hot(currentData.label.categoryId, Object.keys(labelMap).length));
  }
  const pathDs = tf.data.Dataset.from_tensor_slices(imageNames);
  const imageDs = pathDs.map(loadImage.loadImage, boa.kwargs({
    num_parallel_calls: AUTOTUNE
  }));
  const labelDs = tf.data.Dataset.from_tensor_slices(labels);
  const imageLabelDs = tf.data.Dataset.zip(tuple([ imageDs, labelDs ]));
  return imageLabelDs;
}

/**
 * this is plugin used to train tfjs model with pascal voc data format for image classification problem.
 * @param data : train data
 * @param model : model loaded before
 * @param epochs : need to specify epochs
 * @param batchSize : need to specify batch size
 * @param optimizer : need to specify optimizer
 */
const ModelTrain: ModelTrainType = async (data: ImageDataset, model: UniModel, args: ModelTrainArgsType): Promise<UniModel> => {
  try {
    const {
      epochs = 10,
      batchSize = 16,
      modelPath
    } = args;

    const { trainLoader, validationLoader, metadata } = data;

    let trainDataSet = await createDataset(trainLoader, metadata.labelMap);
    const count = await trainLoader.len();

    trainDataSet = trainDataSet.repeat();
    trainDataSet = trainDataSet.batch(batchSize);
    trainDataSet = trainDataSet.prefetch(boa.kwargs({
      buffer_size: AUTOTUNE
    }));

    const trainConfig: TrainConfig = {
      epochs: epochs,
      steps_per_epoch: parseInt(String(count / batchSize))
    };

    if (validationLoader) {
      console.log('create validation dataset');
      let validationDataSet = await createDataset(validationLoader, metadata.labelMap);
      const valCount = await validationLoader.len();
      validationDataSet = validationDataSet.batch(batchSize);
      trainConfig.validation_data = validationDataSet;
      trainConfig.validation_steps = parseInt(String(valCount / batchSize));
    }

    const trainModel = model.model;
    await trainModel.fit(trainDataSet, boa.kwargs(trainConfig));
    await trainModel.save_weights(path.join(modelPath, 'weights.h5'));
    await trainModel.save(path.join(modelPath, 'model.h5'));

    const result: UniModel = {
      ...model,
      model: trainModel
    };
    return result;
  } catch (err) {
    console.error('occurs an error on model trainer', err);
    throw err;
  }
};

export default ModelTrain;
