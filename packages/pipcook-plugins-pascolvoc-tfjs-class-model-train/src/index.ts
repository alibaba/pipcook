import {PascolVocSampleData, ModelTrainType, TfJsLayersModel, ModelTrainArgsType, parseAnnotation} from '@pipcook/pipcook-core';

import * as path from 'path';
import glob from 'glob-promise';
import * as tf from '@tensorflow/tfjs-node-gpu';
import cliProgress from 'cli-progress';
import Jimp from 'jimp';

async function createDataset(dataPaths: string[], dataDir: string, labelMap:  {
  [key: string]: number;
}) {
  let dataFlows: any = [];
  const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar1.start(dataPaths.length, 0);
  for (let i = 0; i < dataPaths.length; i++) {
    bar1.update(i);
    const dataJson = await parseAnnotation(dataPaths[i]);
    let image = await Jimp.read(path.join(dataDir, dataJson.annotation.filename[0]));
    const trainImageBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);
    const imageArray = new Uint8Array(trainImageBuffer);
    let label: string = dataJson.annotation.object[0].name[0];
    let ys: tf.Tensor<tf.Rank>;
    if (Object.keys(labelMap).length > 1) {
      ys = tf.tidy(() => tf.oneHot(tf.scalar(labelMap[label], 'int32'), Object.keys(labelMap).length));
    }
    dataFlows.push(tf.tidy(() => ({
      xs: tf.tidy(() => tf.cast(tf.node.decodeImage(imageArray, 3), 'float32')),
      ys
    })));
  }
  bar1.stop();
  return tf.data.array(dataFlows);
}

/**
 * this is plugin used to train tfjs model with pascol voc data format for image classification problem.
 * @param data : train data
 * @param model : model loaded before
 * @param epochs : need to specify epochs
 * @param batchSize : need to specify batch size
 * @param optimizer : need to specify optimizer
 */
const ModelTrain: ModelTrainType = async (data: PascolVocSampleData, model: TfJsLayersModel, args: ModelTrainArgsType): Promise<TfJsLayersModel> => {
  try {
    const {
      epochs = 10,
      batchSize = 16,
      saveModel
    } = args;

    const metaData = data.metaData;

    const trainData = await glob(path.join(data.trainData, '*.xml'));

    const trainConfig: any = {
      epochs: epochs,
      batchesPerEpoch: parseInt(String(trainData.length / batchSize))
    }

    console.log('create train dataset');
    const trainDataSet = await createDataset(trainData, data.trainData, metaData.labelMap);
    const ds = trainDataSet.repeat().batch(batchSize);
    let validationDataSet: tf.data.Dataset<tf.TensorContainer>;
    if (data.validationData) {
      const validationData = await glob(path.join(data.validationData, '*.xml'));
      console.log('create validation dataset');
      validationDataSet = await createDataset(validationData, data.validationData, metaData.labelMap);
      const validateDs = validationDataSet.batch(batchSize);
      trainConfig.validationData = validateDs;
      trainConfig.validationBatches = parseInt(String(validationData.length / batchSize));
    }

    const trainModel = model.model;
    
    await trainModel.fitDataset(ds, trainConfig);

    await saveModel(async (modelPath: string) => {
      await trainModel.save('file://' + modelPath);
    })

    const result: TfJsLayersModel = {
      ...model,
      model: trainModel
    }
    return result;
  } catch (err) {
    console.log('[ERROR] model trainer', err);
    throw err;
  }
}

export default ModelTrain;