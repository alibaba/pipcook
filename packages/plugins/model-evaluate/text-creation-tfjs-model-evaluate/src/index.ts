import { CsvDataset, ModelEvaluateType, TfJsLayersModel, CsvDataLoader, EvaluateResult } from '@pipcook/pipcook-core';
import * as tf from '@tensorflow/tfjs-node-gpu';
import { Scalar } from '@tensorflow/tfjs-node-gpu';

async function createDataset(loader: CsvDataLoader, labelMap: string[]): Promise<tf.data.Dataset<tf.TensorContainer>> {
  const inputs = [] as tf.TensorContainer[];
  const len = await loader.len();
  const onehotLen = labelMap.length;
  for (let i = 0; i < len; i++) {
    const sample = await loader.getItem(i);
    inputs.push(tf.tidy(() => {
      return {
        xs: tf.tidy(() => sample.data),
        ys: tf.tidy(() => tf.oneHot(tf.scalar(sample.label, 'int32'), onehotLen))
      };
    }));
  }
  return tf.data.array(inputs);
}

/**
 *
 * @param data Pipcook uniform sample data
 * @param model Pipcook model
 * @param args args: specify batch size, total batches to iterate
 */
const evlauate: ModelEvaluateType = async (dataset: CsvDataset, uniModel: TfJsLayersModel): Promise<EvaluateResult> => {
  const batchSize = 16;
  const { testLoader, metadata } = dataset;
  if (!testLoader) {
    return { pass: true };
  }

  const count = await testLoader.len();
  const batches = Math.floor(count / batchSize);
  const testDataset = await createDataset(testLoader, metadata.labelMap as unknown as string[]);
  console.info('created test dataset', testDataset, count, batches);

  const ds = testDataset.repeat().batch(batchSize) as tf.data.Dataset<{}>;
  const model: tf.LayersModel = uniModel.model;
  let result: any = await model.evaluateDataset(ds, { batches });
  console.info(result);

  let metrics = [ 'loss' ];
  if (model.metrics) {
    metrics = [ ...metrics, ...uniModel.metrics ];
  }

  const evalRes: EvaluateResult = { pass: true };
  metrics.forEach((metric: string, idx: number) => {
    evalRes[metric] = result[idx].dataSync();
  });
  console.log(evalRes);
  return evalRes;
};

export default evlauate;
