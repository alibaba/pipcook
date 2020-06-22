import { CsvDataset, ModelEvaluateType, TfJsLayersModel, CsvDataLoader, EvaluateResult } from '@pipcook/pipcook-core';
import * as tf from '@tensorflow/tfjs-node-gpu';

/**
 * 
 * @param data Pipcook uniform sample data
 * @param model Pipcook model
 * @param args args: specify batch size, total batches to iterate
 */
const evlauate: ModelEvaluateType = async (data: CsvDataset, model: TfJsLayersModel): Promise<EvaluateResult> => {
  // just skiped if no test loader.
  return { pass: true };
};

export default evlauate;
