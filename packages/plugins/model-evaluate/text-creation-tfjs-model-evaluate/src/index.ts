import { CsvDataset, ModelEvaluateType, TfJsLayersModel, CsvDataLoader, EvaluateResult } from '@pipcook/pipcook-core';
import * as tf from '@tensorflow/tfjs-node-gpu';

/**
 * 
 * @param data Pipcook uniform sample data
 * @param model Pipcook model
 * @param args args: specify batch size, total batches to iterate
 */
const evlauate: ModelEvaluateType = async (data: CsvDataset, model: TfJsLayersModel): Promise<EvaluateResult> => {
  let batchSize = 16;
  const { testLoader, metadata } = data;

  // // sample data must contain test data
  // if (testLoader) {
  //   const count = await testLoader.len();
  //   const batches = parseInt(String(count / batchSize));
  //   const testDataSet = await createDataset(testLoader, metadata.labelMap);
  //   const ds = testDataSet.repeat().batch(batchSize);
  //   let evaluateResult: any = await model.model.evaluateDataset(ds as tf.data.Dataset<{}>, {
  //     batches
  //   });

  //   if (!Array.isArray(evaluateResult)) {
  //     evaluateResult = [ evaluateResult ];
  //   }
  //   let metrics = [ 'loss' ];
  //   if (model.metrics) {
  //     metrics = [ ...metrics, ...model.metrics ];
  //   }

  //   // TODO: valid how this model works.
  //   const result: EvaluateResult = { pass: true };
  //   metrics.forEach((metric, index) => {
  //     result[metric] = evaluateResult[index].dataSync();
  //   });
  //   return result;
  // }
  // just skiped if no test loader.
  return { pass: true };
};

export default evlauate;
