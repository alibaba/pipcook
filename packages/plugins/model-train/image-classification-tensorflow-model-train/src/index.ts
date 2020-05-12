import { ImageDataset, ModelTrainType, UniModel, ModelTrainArgsType, ImageDataLoader } from '@pipcook/pipcook-core';

const boa = require('@pipcook/boa');
const { tuple } = boa.builtins();
const tf = boa.import('tensorflow');
const AUTOTUNE = tf.data.experimental.AUTOTUNE;

interface TrainConfig {
  epochs: number;
  steps_per_epoch: number;
  validation_data?: any;
  validation_steps?: number;
}

function loadImage(path: string) {
  let image = tf.io.read_file(path);
  image = tf.image.decode_jpeg(image, boa.kwargs({
    channels: 3
  }));
  return image;
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
  const imageDs = pathDs.map(loadImage, boa.kwargs({
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
      saveModel
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

    await saveModel(async (modelPath: string) => {
      await trainModel.save_weights(modelPath);
    });

    const result: UniModel = {
      ...model,
      model: trainModel
    };
    return result;
  } catch (err) {
    console.log('[ERROR] model trainer', err);
    throw err;
  }
};

export default ModelTrain;
