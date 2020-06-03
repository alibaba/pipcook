import { ModelDefineType, UniModel, ModelDefineArgsType, ImageSample, CocoDataset } from '@pipcook/pipcook-core';
import * as path from 'path';
import * as fs from 'fs';

const boa = require('@pipcook/boa');

const detectronModelDefine: ModelDefineType = async (data: CocoDataset, args: ModelDefineArgsType): Promise<UniModel> => {
  let {
    baseLearningRate = 0.00025,
    numWorkers = 4,
    numClasses = 0,
    recoverPath
  } = args;

  let cfg: any;
  if (recoverPath) {
    const log = JSON.parse(fs.readFileSync(path.join(recoverPath, 'log.json'), 'utf8'));
    const labelMap = log.metadata.labelMap;
    numClasses = Object.keys(labelMap).length;
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
  if (data.metadata.isBitMask) {
    cfg.INPUT.MASK_FORMAT = 'bitmask';
  }
  
  cfg.merge_from_file(path.join(__dirname, 'config', 'mask_rcnn_R_50_C4_3x.yaml'));
  cfg.DATALOADER.NUM_WORKERS = numWorkers;

  if (recoverPath) {
    cfg.MODEL.WEIGHTS = path.join(recoverPath, 'model', 'model_final.pth');
  } else {
    cfg.MODEL.WEIGHTS = "detectron2://ImageNetPretrained/MSRA/R-50.pkl";
  }
    
  cfg.SOLVER.IMS_PER_BATCH = 4;
  cfg.SOLVER.BASE_LR = baseLearningRate;

  if (!torch.cuda.is_available()) {
    cfg.MODEL.DEVICE = 'cpu';
  }
    
  cfg.MODEL.ROI_HEADS.BATCH_SIZE_PER_IMAGE = 128;
  cfg.MODEL.ROI_HEADS.NUM_CLASSES = numClasses;

  const pipcookModel: UniModel = {
    model: null,
    config: cfg,
    predict: function (inputData: ImageSample) {
      const predictor = DefaultPredictor(this.config);
      const img = cv2.imread(inputData.data);
      const out = predictor(img);
      const ins = out['instances'].to(torch.device('cpu'));
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
