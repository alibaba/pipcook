
import { UniModel, UniDataset, ArgsType, ModelEvaluateType, EvaluateResult } from '@pipcook/pipcook-core';

const templateModelEvaluate: ModelEvaluateType = async (data: UniDataset, model: UniModel, args: ArgsType): Promise<EvaluateResult> => {
  return {} as EvaluateResult;
}

export default templateModelEvaluate;
