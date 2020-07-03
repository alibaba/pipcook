import { ImageDataset, ModelTrainType, UniModel, ModelTrainArgsType, ImageDataLoader } from '@pipcook/pipcook-core';

import * as tf from '@tensorflow/tfjs-node-gpu';
import Jimp from 'jimp';

async function dateIterator(dataLoader: ImageDataLoader, labelMap: {
  [key: string]: number;
}) {
  let index = 0;
  const numElements = 10;
  const count = await dataLoader.len();
  const iterator = {
    next: async () => {
      if (index === count) {
        return {value: null, done: true};
      }
      let dataFlows: any = [];
      const currentIndex = index;
      for(; index < count && index < currentIndex + numElements; index++) {
        const currentData = await dataLoader.getItem(index);
        let image = await Jimp.read(currentData.data);
        const trainImageBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);
        const imageArray = new Uint8Array(trainImageBuffer);
        let label: number = currentData.label.categoryId;
        let ys: tf.Tensor<tf.Rank>;
        ys = tf.tidy(() => tf.oneHot(tf.scalar(label, 'int32'), Object.keys(labelMap).length));
        dataFlows.push(tf.tidy(() => ({
          xs: tf.tidy(() => tf.cast(tf.node.decodeImage(imageArray, 3), 'float32')),
          ys
        })));
      }
      return {value: tf.data.array(dataFlows), done: false};
    }
  };
  return iterator;
}

async function createDataset(dataLoader: ImageDataLoader, labelMap: {
  [key: string]: number;
}) {
  return tf.data.generator(dateIterator);
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
  const {
    epochs = 10,
    batchSize = 16,
    modelPath
  } = args;

  const { trainLoader, validationLoader, metadata } = data;

  const count = await trainLoader.len();

  const trainConfig: any = {
    epochs: epochs,
    batchesPerEpoch: Math.floor(count / batchSize)
  };

  console.log('create train dataset');
  const trainDataSet = await createDataset(trainLoader, metadata.labelMap);
  const ds = trainDataSet.repeat().batch(batchSize);
  let validationDataSet: tf.data.Dataset<any>;
  if (validationLoader) {
    console.log('create validation dataset');
    validationDataSet = await createDataset(validationLoader, metadata.labelMap);
    const valCount = await validationLoader.len();
    const validateDs = validationDataSet.batch(batchSize);
    trainConfig.validationData = validateDs;
    trainConfig.validationBatches = parseInt(String(valCount / batchSize));
  }

  const trainModel = model.model;
  await trainModel.fitDataset(ds, trainConfig);
  await trainModel.save(`file://${modelPath}`);

  return {
    ...model,
    model: trainModel
  };
};

export default ModelTrain;
