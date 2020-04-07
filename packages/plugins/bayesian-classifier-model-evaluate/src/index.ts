import { ModelEvaluateType, PipcookModel, UniformTfSampleData, EvaluateResult } from '@pipcook/pipcook-core';
import { Python } from '@pipcook/pipcook-python-node';

const bayesianModelEvaluate: ModelEvaluateType 
  = async (data: UniformTfSampleData, model: PipcookModel): Promise<EvaluateResult> => {
    const { model: classifier } = model;
    const { feature_list, text_list } = model.extraParams;

    let result;
    await Python.scope('bayes_text_classification', async (python: any) => {
      const test_accuracy = classifier.score(feature_list[1], text_list[4]);
      result = await python.evaluate(test_accuracy);
    });
    return {
      accuracy: result
    };
  };

export default bayesianModelEvaluate;
