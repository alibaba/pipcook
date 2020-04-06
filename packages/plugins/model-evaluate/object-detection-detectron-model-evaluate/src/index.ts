import { ModelEvaluateType, PipcookModel, CocoDataset, ArgsType } from '@pipcook/pipcook-core';
import * as path from 'path';

const boa = require('@pipcook/boa');
const sys = boa.import('sys');

const detectronModelEvaluate: ModelEvaluateType = async (data: CocoDataset, model: PipcookModel, args: ArgsType): Promise<any> => {
  let {
    modelDir
  } = args;

  const {register_coco_instances} = boa.import('detectron2.data.datasets');

  const {testLoader} = data;
  const cfg = model.config;

  if (testLoader && model.model) {
    const trainer = model.model;
    const {COCOEvaluator, inference_on_dataset} = boa.import('detectron2.evaluation');
    const {build_detection_test_loader} = boa.import('detectron2.data');

    register_coco_instances("test_dataset", {}, data.testAnnotationPath, path.join(data.testAnnotationPath, '..'));
    cfg.DATASETS.TEST = [ "test_dataset" ];

    const evaluator = COCOEvaluator("test_dataset", cfg, false, boa.kwargs({ output_dir: modelDir}));
      
    const val_loader = build_detection_test_loader(cfg, "val_dataset");

    const val_result = inference_on_dataset(trainer.model, val_loader, evaluator);

    return {
      result: val_result
    }
  }
};

export default detectronModelEvaluate;
