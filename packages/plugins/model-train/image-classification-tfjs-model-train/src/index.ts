import { ImageDataset, ModelTrainType, UniModel, ModelTrainArgsType, ImageDataLoader } from '@pipcook/pipcook-core';

import * as tf from '@tensorflow/tfjs-node-gpu';
import Jimp from 'jimp';
import { train } from '@tensorflow/tfjs-node-gpu';

async function dataIterator(dataLoader: ImageDataLoader, labelMap: {
  [key: string]: number;
}): Promise<any> {
  const count = await dataLoader.len();
  return (): AsyncIterator<tf.TensorContainer> => {
    let index = 0;
    return {
      async next(): Promise<IteratorResult<tf.TensorContainer>> {
        if (index >= count) {
          return { value: null, done: true };
        }
        const currentData = await dataLoader.getItem(index);
        const image = await Jimp.read(currentData.data);
        const trainImageBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);
        const imageArray = new Uint8Array(trainImageBuffer);
        const label: number = currentData.label.categoryId;
        index++;
        return { value: tf.tidy(() => ({
          xs: tf.tidy(() => tf.cast(tf.node.decodeImage(imageArray, 3), 'float32')),
          ys: tf.tidy(() => tf.oneHot(tf.scalar(label, 'int32'), Object.keys(labelMap).length))
        })), done: false };
      }
    };
  };
}

async function createDataset(dataLoader: ImageDataLoader, labelMap: {
  [key: string]: number;
}) {
  return tf.data.generator(await dataIterator(dataLoader, labelMap));
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

  const { trainLoader, validationLoader } = data;

  const count = await trainLoader.len();
  const valCount = await validationLoader.len();
  const batchesPerEpoch = Math.floor(count / batchSize);
  const valBatchesPerEpoch = Math.floor(valCount / batchSize);
  const trainModel = model.model;

  for (let i = 0; i < epochs; i++) {
    console.log(`Epoch ${i}/${epochs} start`);
    for (let j = 0; j < batchesPerEpoch; j++) {
      const dataBatch = await data.trainLoader.nextBatch(batchSize);
      console.log(1)
      const xs = tf.stack(dataBatch.map(ele => ele.data));
      const ys = tf.stack(dataBatch.map(ele => ele.label));
      console.log(2)
      const trainRes = await trainModel.trainOnBatch(xs, ys);
      console.log(`Iteration ${j}/${batchesPerEpoch} result --- loss: ${trainRes[0]} accuracy: ${trainRes[1]}`);
    }
    let loss = 0;
    let accuracy = 0;
    for (let j = 0; j < valBatchesPerEpoch; j++) {
      const dataBatch = await validationLoader.nextBatch(batchSize);
      const xs = tf.stack(dataBatch.map(ele => ele.data));
      const ys = tf.stack(dataBatch.map(ele => ele.label));
      const evaluateRes = await trainModel.evaluate(xs, ys);
      loss += Number(evaluateRes[0].dataSync());
      accuracy += Number(evaluateRes[1].dataSync());
    }
    loss /= valBatchesPerEpoch;
    accuracy /= valBatchesPerEpoch;
    console.log(`Validation Result ${i}/${epochs} result --- loss: ${loss} accuracy: ${accuracy}`);
  }

  await trainModel.save(`file://${modelPath}`);

  return {
    ...model,
    model: trainModel
  };
};

export default ModelTrain;
