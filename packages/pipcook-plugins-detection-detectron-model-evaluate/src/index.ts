import {ModelEvaluateType, PipcookModel, UniformGeneralSampleData, ArgsType, EvaluateResult} from '@pipcook/pipcook-core';
import {Python} from '@pipcook/pipcook-python-node';
import * as assert from 'assert';
import * as path from 'path';

const imageDetectronModelTrain: ModelEvaluateType = 
  async (data: UniformGeneralSampleData, model: PipcookModel, args?: ArgsType): Promise<EvaluateResult> => {
  if (!(data.validationData || data.testData)) {
    return {};
  }
  assert.ok(model && model.config, 'Error! No model path detected');
  const config = model.config;
  let trainer = model.model;
  let evaluationResult: string = '';
  await Python.scope('detectron', async (python: any) => {
    const _ = python.nA;
    const cfg = python.runRaw(Python.convert(config));
    trainer = python.runRaw(Python.convert(trainer));

    const [COCOEvaluator, inference_on_dataset] = 
      python.fromImport('detectron2.evaluation', ['COCOEvaluator', 'inference_on_dataset']);
    
    const [build_detection_test_loader] = python.fromImport('detectron2.data', ['build_detection_test_loader']);

    const evaluator = COCOEvaluator("val_dataset", cfg, false, _({output_dir:path.join(process.cwd(), '.temp', 'output')}));
    
    const val_loader = build_detection_test_loader(cfg, "val_dataset")

    const val_result = inference_on_dataset(trainer.model, val_loader, evaluator)

    evaluationResult = await python.evluate(val_result);
  });
  return {
    result: evaluationResult
  };
}

export default imageDetectronModelTrain;