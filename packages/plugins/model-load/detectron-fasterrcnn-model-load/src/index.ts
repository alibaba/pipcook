import { ModelLoadType, PipcookModel, ModelLoadArgsType, getModelDir, getMetadata, CocoDataset } from '@pipcook/pipcook-core';
import * as path from 'path';
import * as assert from 'assert';

const boa = require('@pipcook/boa');

const detectronModelLoad: ModelLoadType = async (data: CocoDataset, args: ModelLoadArgsType): Promise<PipcookModel> => {
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
    const labelMap = getMetadata(modelId).label.labelMap;
    numClasses = Object.keys(labelMap).length;
  } else if (modelPath) {
    assert.ok(!isNaN(numClasses), 'please give out the number of classes');
  } else {
    numClasses = Object.keys(data.metaData.labelMap).length;
  }

  const { get_cfg } = boa.import('detectron2.config');
  const { setup_logger } = boa.import('detectron2.utils.logger');
  const torch = boa.import('torch');
  const { DefaultPredictor } = boa.import('detectron2.engine.defaults');
  const cv2 = boa.import('cv2');
  const numpy = boa.import('numpy');

  setup_logger();

  cfg = get_cfg();
  cfg.merge_from_file(path.join(__dirname, 'config', 'faster_rcnn_R_50_C4_3x.yaml'));
  cfg.DATALOADER.NUM_WORKERS = numWorkers;

  if (modelId) {
    cfg.MODEL.WEIGHTS = path.join(getModelDir(modelId), 'model_final.pth');
  } else if (modelPath) {
    cfg.MODEL.WEIGHTS = modelPath;
  } else {
    cfg.MODEL.WEIGHTS = "detectron2://ImageNetPretrained/MSRA/R-50.pkl";
  }
    
  cfg.SOLVER.IMS_PER_BATCH = 4;
  cfg.SOLVER.BASE_LR = baseLearningRate;
  cfg.SOLVER.NUM_GPUS = numGpus;

  if (!torch.cuda.is_available()) {
    cfg.MODEL.DEVICE = 'cpu';
  }
    
  cfg.MODEL.ROI_HEADS.BATCH_SIZE_PER_IMAGE = 128;
  cfg.MODEL.ROI_HEADS.NUM_CLASSES = numClasses;

  const pipcookModel: PipcookModel = {
    model: null,
    config: cfg,
    predict: function (inputData: string[]) {
      const predictor = DefaultPredictor(this.cfg);
      const images = inputData.map((data: string) => {
        return cv2.imread(data);
      });
      const img = numpy.array(images);
      const out = predictor(img);
      const ins = out['instances'].to(torch.device('cpu'));
      const boxes = ins.pred_boxes.tensor.numpy();
      const scores = ins.scores.numpy();
      const classes = ins.pred_classes.numpy();
      return {
        boxes,
        scores,
        classes
      };
    }
  };
  return pipcookModel;

};

export default detectronModelLoad;
