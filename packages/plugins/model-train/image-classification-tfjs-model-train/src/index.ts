import { ImageDataset, ModelTrainType, TfJsLayersModel, ModelTrainArgsType, ImageDataLoader } from '@pipcook/pipcook-core';

import * as tf from '@tensorflow/tfjs-node-gpu';
import Jimp from 'jimp';

async function createDataset(dataLoader: ImageDataLoader, labelMap: {
  [key: string]: number;
}) {
  let dataFlows: any = [];
  const count = await dataLoader.len();
  for (let i = 0; i < count; i++) {
    const currentData = await dataLoader.getItem(i);
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
  return tf.data.array(dataFlows);
}

/**
 * this is plugin used to train tfjs model with pascal voc data format for image classification problem.
 * @param data : train data
 * @param model : model loaded before
 * @param epochs : need to specify epochs
 * @param batchSize : need to specify batch size
 * @param optimizer : need to specify optimizer
 */
const ModelTrain: ModelTrainType = async (data: ImageDataset, model: TfJsLayersModel, args: ModelTrainArgsType): Promise<TfJsLayersModel> => {
  try {
    const {
      epochs = 10,
      batchSize = 16,
      saveModel
    } = args;

    const { trainLoader, validationLoader, metadata } = data;

    const count = await trainLoader.len();

    const trainConfig: any = {
      epochs: epochs,
      batchesPerEpoch: parseInt(String(count / batchSize))
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

    await saveModel(async (modelPath: string) => {
      await trainModel.save('file://' + modelPath);
    });

    const result: TfJsLayersModel = {
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
