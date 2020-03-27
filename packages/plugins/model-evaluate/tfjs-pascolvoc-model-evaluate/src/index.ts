import {tfJsLayersModel, ArgsType, ModelEvaluateType, EvaluateResult, VocDataset, parseAnnotation} from '@pipcook/pipcook-core';

import * as tf from '@tensorflow/tfjs-node-gpu';
import * as path from 'path';
import glob from 'glob-promise';
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
 * 
 * @param data Pipcook uniform sample data
 * @param model Pipcook model
 * @param args args: specify batch size, total batches to iterate
 */
const ModelEvalute: ModelEvaluateType = async (data: VocDataset, model: tfJsLayersModel, args: ArgsType): Promise<EvaluateResult> => {
  
  let batchSize = 16;

  // sample data must contain test data
  if (data.testData) {
    const testData = await glob(path.join(data.testData, '*.xml'));
    const trainDataSet = await createDataset(testData, data.testData, data.metaData.labelMap);
    const batches = Math.ceil(testData.length / batchSize);

    const ds = trainDataSet.repeat().batch(batchSize);
    let evaluateResult: any = await model.model.evaluateDataset(ds as tf.data.Dataset<{}>, {
      batches
    });

    if (!Array.isArray(evaluateResult)) {
      evaluateResult = [evaluateResult];
    }

    let metrics = ['loss'];
    if (model.metrics) {
      metrics = [...metrics, ...model.metrics];
    }
    const result: any = {};
    metrics.forEach((metric, index) => {
      result[metric] = evaluateResult[index].dataSync();
    });
    return result;
  } 
  
  return {};
}

export default ModelEvalute;
