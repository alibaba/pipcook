/**
 * @file This is for plugin to evaluate  model.
 */
import { PipcookModel, UniformTfSampleData, ArgsType, ModelEvaluateType, EvaluateResult } from '@pipcook/pipcook-core';
import * as tf from '@tensorflow/tfjs-node-gpu';
import * as assert from 'assert';

/**
 * 
 * @param data Pipcook uniform sample data
 * @param model Pipcook model
 * @param args args: specify batch size, total batches to iterate
 */
const ModelEvalute: ModelEvaluateType = async (data: UniformTfSampleData, model: PipcookModel, args?: ArgsType): Promise<EvaluateResult> => {
  let batchSize = 32;
  let batches = null;
  let dataSize = 0;
  if (args && args.batchSize) {
    batchSize = args.batchSize;
  }
  if (args && args.batches) {
    batches = args.batches;
  }
  
  const metaData = data.metaData;
  assert.ok(metaData.feature && metaData.feature.name, 'data should have feature and feature name');
  assert.ok(metaData.label && metaData.label.name, 'data should have label');

  // sample data must contain test data
  if (data.testData) {
    if (!batches && (!data.testData || !data.testData.size) && (!data.metaData.testSize)) {
      throw new Error('Please specify the batches.');
    }
    if (!batches) {
      dataSize = ((data.testData && data.testData.size) || data.metaData.testSize) as number;
    }

    const testData = data.testData;
    
    // just call evalute api if the model is tf-js modek
    if (model.model instanceof tf.LayersModel) {
      batches = Math.ceil(Number(dataSize) / batchSize)
      const ds = testData.repeat().batch(batchSize);
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
      const result: any = {};
      metrics.forEach((metric, index) => {
        result[metric] = evaluateResult[index].dataSync();
      });
      console.log('evaluate result: ', result);
      return result;
    } else {
      // Pipcook model implements predict interface, call it to calculate accuracy manually
      batches = Number(dataSize);
      const trueY = [];
      const predictY = [];
      const iterator = await data.testData.iterator();
      for (let i = 0; i < batches; i++) {
        const nextBatch = await iterator.next();
        const nextBatchData = nextBatch.value;
        trueY.push(nextBatchData.ys.dataSync());
        predictY.push(
          model.predict(nextBatchData.xs)
        )
      }
      // const precision = tf.metrics.precision(tf.tensor(trueY), tf.tensor(predictY));
      // const recall = tf.metrics.recall(tf.tensor(trueY), tf.tensor(predictY));
      let correctCount = 0;
      let totalCount = 0;
      for (let i = 0; i < trueY.length; i++) {
        if (trueY[i][0] === predictY[i][0]) {
          correctCount++;
        }
        totalCount++;
      }

      return {
        // precision: precision.dataSync()[0], 
        // recall: recall.dataSync()[0],
        accuracy: correctCount / totalCount
      }
    }
  } 
  
  return {};
}

export default ModelEvalute;
