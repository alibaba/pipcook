import { ModelEvaluateType, UniModel, CocoDataset, ArgsType, EvaluateResult } from '@pipcook/pipcook-core';
import * as path from 'path';

const boa = require('@pipcook/boa');

const detectronModelEvaluate: ModelEvaluateType = async (data: CocoDataset, model: UniModel, args: ArgsType): Promise<EvaluateResult> => {
  let { modelDir } = args;
  const { register_coco_instances } = boa.import('detectron2.data.datasets');
  const { testLoader } = data;
  const cfg = model.config;

  if (testLoader && model.model) {
    const trainer = model.model;
    const { COCOEvaluator, inference_on_dataset } = boa.import('detectron2.evaluation');
    const { build_detection_test_loader } = boa.import('detectron2.data');

    register_coco_instances('test_dataset', {}, data.testAnnotationPath, path.join(data.testAnnotationPath, '..'));
    cfg.DATASETS.TEST = [ 'test_dataset' ];

    const evaluator = COCOEvaluator('test_dataset', cfg, false, boa.kwargs({ output_dir: modelDir }));
    const val_loader = build_detection_test_loader(cfg, 'test_dataset');
    return {
      pass: true,
      result: inference_on_dataset(trainer.model, val_loader, evaluator)
    }
  }

  return {
    pass: true
  };
};

export default detectronModelEvaluate;
