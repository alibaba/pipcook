import { ImageDataset, ModelEvaluateType, UniModel, EvaluateResult } from '@pipcook/pipcook-core';

import * as tf from '@tensorflow/tfjs-node-gpu';

/**
 *
 * @param data Pipcook uniform sample data
 * @param model Pipcook model
 * @param args args: specify batch size, total batches to iterate
 */
const ModelEvalute: ModelEvaluateType =
  async (data: ImageDataset, model: UniModel): Promise<EvaluateResult> => {

    let batchSize = 16;

    const { testLoader } = data;

    // sample data must contain test data
    if (testLoader) {
      const count = await testLoader.len();
      const batches = parseInt(String(count / batchSize));

      let loss = 0;
      let accuracy = 0;

      for (let i = 0; i < batches; i++) {
        const dataBatch = await data.testLoader.nextBatch(batchSize);
        const xs = tf.stack(dataBatch.map((ele) => ele.data));
        const ys = tf.stack(dataBatch.map((ele) => ele.label));
        const evaluateRes = await model.model.evaluate(xs, ys);
        loss += Number(evaluateRes[0].dataSync());
        accuracy += Number(evaluateRes[1].dataSync());
      }

      loss /= batches;
      accuracy /= batches;

      console.log(`Evaluate Result: loss: ${loss} accuracy: ${accuracy}`);

      return {
        loss,
        accuracy
      };
    }
    // just skiped if no test loader.
    return { pass: true };
  };

export default ModelEvalute;
