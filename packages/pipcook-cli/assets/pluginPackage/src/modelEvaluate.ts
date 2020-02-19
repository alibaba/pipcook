
import {PipcookModel, UniformSampleData, ArgsType, ModelEvaluateType, EvaluateResult} from '@pipcook/pipcook-core';

const templateModelEvaluate: ModelEvaluateType = async (data: UniformSampleData, model: PipcookModel, args?: ArgsType): Promise<EvaluateResult> => {
  return {} as EvaluateResult;
}

export default templateModelEvaluate;
