import { ModelTrainType, UniModel, CocoDataset, ModelTrainArgsType } from '@pipcook/pipcook-core';
import * as path from 'path';

const boa = require('@pipcook/boa');

const detectronModelDefine: ModelTrainType = async (data: CocoDataset, model: UniModel, args: ModelTrainArgsType): Promise<UniModel> => {
  let {
    steps = 100000,
    modelPath
  } = args;

  const os = boa.import('os');
  const { DefaultTrainer } = boa.import('detectron2.engine');

  const { register_coco_instances } = boa.import('detectron2.data.datasets');
  const { trainLoader, validationLoader } = data;
  const cfg = model.config;

  if (trainLoader) {
    register_coco_instances("train_dataset", {}, data.trainAnnotationPath, path.join(data.trainAnnotationPath, '..'));
    cfg.DATASETS.TRAIN = [ "train_dataset" ];
    if (validationLoader) {
      register_coco_instances("val_dataset", {}, data.validationAnnotationPath, path.join(data.validationAnnotationPath, '..'));
      cfg.DATASETS.TEST = [ "val_dataset" ];
    } else {
      cfg.DATASETS.TEST = [ "train_dataset" ];
    }

    cfg.SOLVER.MAX_ITER = steps;
    cfg.OUTPUT_DIR = modelPath;
    os.makedirs(cfg.OUTPUT_DIR, boa.kwargs({ "exist_ok": true }));
    const trainer = DefaultTrainer(cfg);
    trainer.resume_or_load(boa.kwargs({ "resume": true }));

    trainer.train();
    return {
      ...model,
      model: trainer
    };
  }

  return model;
};

export default detectronModelDefine;
