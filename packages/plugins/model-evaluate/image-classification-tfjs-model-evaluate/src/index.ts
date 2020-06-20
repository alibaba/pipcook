import { ImageDataset, ModelEvaluateType, TfJsLayersModel, ImageDataLoader, EvaluateResult } from '@pipcook/pipcook-core';

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
 *
 * @param data Pipcook uniform sample data
 * @param model Pipcook model
 * @param args args: specify batch size, total batches to iterate
 */
const ModelEvalute: ModelEvaluateType =
  async (data: ImageDataset, model: TfJsLayersModel): Promise<EvaluateResult> => {

    let batchSize = 16;

    const { testLoader, metadata } = data;

    // sample data must contain test data
    if (testLoader) {
      const count = await testLoader.len();
      const batches = parseInt(String(count / batchSize));
      const testDataSet = await createDataset(testLoader, metadata.labelMap);
      const ds = testDataSet.repeat().batch(batchSize);
      let evaluateResult: any = await model.model.evaluateDataset(ds as tf.data.Dataset<{}>, {
        batches
      });

      if (!Array.isArray(evaluateResult)) {
        evaluateResult = [ evaluateResult ];
      }
      let metrics = [ 'loss' ];
      if (model.metrics) {
        metrics = [ ...metrics, ...model.metrics ];
      }

      // TODO: valid how this model works.
      const result: EvaluateResult = { pass: true };
      metrics.forEach((metric, index) => {
        result[metric] = evaluateResult[index].dataSync();
      });
      return result;
    }
    // just skiped if no test loader.
    return { pass: true };
  };

export default ModelEvalute;
