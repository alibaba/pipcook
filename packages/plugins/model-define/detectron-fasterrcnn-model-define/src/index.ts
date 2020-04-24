import {
  ModelDefineType,
  UniModel,
  ModelDefineArgsType,
  getModelDir,
  getMetadata,
  CocoDataset
} from '@pipcook/pipcook-core';
import * as path from 'path';
import * as assert from 'assert';

const boa = require('@pipcook/boa');

const detectronModelDefine: ModelDefineType = async (
  data: CocoDataset,
  args: ModelDefineArgsType
): Promise<UniModel> => {
  let {
    modelId = '',
    baseLearningRate = 0.00025,
    numWorkers = 4,
    numGpus = 2,
    numClasses = 0,
    modelPath = ''
  } = args;

  let cfg: any;

  if (modelId) {
    const { labelMap } = getMetadata(modelId).label;
    numClasses = Object.keys(labelMap).length;
  } else if (modelPath) {
    assert.ok(!isNaN(numClasses), 'please give out the number of classes');
  } else {
    numClasses = Object.keys(data.metadata.labelMap).length;
  }

  const { get_cfg } = boa.import('detectron2.config');
  const { setup_logger } = boa.import('detectron2.utils.logger');
  const torch = boa.import('torch');
  const { DefaultPredictor } = boa.import('detectron2.engine.defaults');
  const cv2 = boa.import('cv2');

  setup_logger();

  cfg = get_cfg();
  cfg.merge_from_file(path.join(__dirname, 'config', 'faster_rcnn_R_50_C4_3x.yaml'));
  cfg.DATALOADER.NUM_WORKERS = numWorkers;

  if (modelId) {
    cfg.MODEL.WEIGHTS = path.join(getModelDir(modelId), 'model_final.pth');
  } else if (modelPath) {
    cfg.MODEL.WEIGHTS = modelPath;
  } else {
    cfg.MODEL.WEIGHTS = 'detectron2://ImageNetPretrained/MSRA/R-50.pkl';
  }

  cfg.SOLVER.IMS_PER_BATCH = 4;
  cfg.SOLVER.BASE_LR = baseLearningRate;
  cfg.SOLVER.NUM_GPUS = numGpus;

  if (!torch.cuda.is_available()) {
    cfg.MODEL.DEVICE = 'cpu';
  }

  cfg.MODEL.ROI_HEADS.BATCH_SIZE_PER_IMAGE = 128;
  cfg.MODEL.ROI_HEADS.NUM_CLASSES = numClasses;

  const pipcookModel: UniModel = {
    model: null,
    config: cfg,
    predict(inputData: string[]) {
      const predictor = DefaultPredictor(this.config);
      const images: any[] = [];
      inputData.forEach((dataItem: string) => {
        const cvImg = cv2.imread(dataItem);
        images.push(cvImg);
      });
      const img = images[0];
      const out = predictor(img);
      const ins = out.instances.to(torch.device('cpu'));
      const boxes = ins.pred_boxes.tensor.numpy();
      const scores = ins.scores.numpy();
      const classes = ins.pred_classes.numpy();
      return {
        boxes: boxes.toString(),
        scores: scores.toString(),
        classes: classes.toString()
      };
    }
  };
  return pipcookModel;
};

export default detectronModelDefine;
