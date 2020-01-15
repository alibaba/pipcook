import {ModelLoadType, PipcookModel, UniformGeneralSampleData, getOsInfo, getModelDir, getMetadata} from '@pipcook/pipcook-core';
import {Python} from '@pipcook/pipcook-python-node';
import * as assert from 'assert';
import * as path from 'path';
import * as tf from '@tensorflow/tfjs-node-gpu';

const fs = require('fs-extra');

const imageDetectionModelLoad: ModelLoadType = async (data: UniformGeneralSampleData, args?: any): Promise<PipcookModel> => {
  const system = await getOsInfo();

  const {
    device='cpu',
    modelId='',
    baseLearningRate=0.00025,
    numWorkers=4,
    maxIter=100000,
    numGpus=2,
  } = args || {};

  let trainer: any;
  let cfg: any;

  if (!modelId) {
    assert.ok(args && args.modelName, 'Please give your model a name');
  } else {
    args.modelName = 'predict';
    const metaData = getMetadata(modelId);
    data = <UniformGeneralSampleData>{...data, metaData};
  }
  
  await Python.scope('detectron', async (python: any) => {
    const _ = python.nA;
    python.runshell('pip install torch torchvision --no-cache-dir ');
    python.runshell('pip install opencv-python --no-cache-dir ');
    python.runshell(`pip install -U 'git+https://github.com/facebookresearch/fvcore' --no-cache-dir `)
    python.runshell('pip install cython --no-cache-dir ');
    python.runshell(`pip install 'git+https://github.com/cocodataset/cocoapi.git#subdirectory=PythonAPI' --no-cache-dir `);
    python.runshell(`pip install 'git+https://github.com/facebookresearch/detectron2.git' --no-cache-dir `);

    await python.reconnect();

    const [register_coco_instances] = python.fromImport('detectron2.data.datasets', ['register_coco_instances']);
    const [DefaultTrainer, hooks] = python.fromImport('detectron2.engine', ['DefaultTrainer', 'hooks']);
    const [get_cfg] = python.fromImport('detectron2.config', ['get_cfg']);
    const os = python.import('os');
    const [setup_logger] = python.fromImport('detectron2.utils.logger', ['setup_logger']);

    setup_logger()

    const validationData = data.validationData || data.testData;
    
    if (data.trainData) {
      register_coco_instances("train_dataset", {}, data.trainData, path.join(data.trainData, '..', '..' , 'images'))
    }
    
    const validationJson = validationData && require(validationData);
    if (validationJson && validationJson.annotations && validationJson.annotations.length > 0) {
      register_coco_instances("val_dataset", {}, validationData, path.join(validationData, '..', '..' , 'images'))
    }

    cfg = get_cfg();
    cfg.merge_from_file(path.join(__dirname, 'config', 'faster_rcnn_R_50_C4_3x.yaml'));
    if (data.trainData) {
      cfg.DATASETS.TRAIN = python.createList(["train_dataset"]);
    }
    
    if (validationJson && validationJson.annotations && validationJson.annotations.length > 0) {
      cfg.DATASETS.TEST = python.createList(['val_dataset']);
    } else {
      cfg.DATASETS.TEST = python.createList(['train_dataset']);
    }

    cfg.DATALOADER.NUM_WORKERS = numWorkers;
    if (!modelId) {
      cfg.MODEL.WEIGHTS = "detectron2://ImageNetPretrained/MSRA/R-50.pkl";
    } else {
      cfg.MODEL.WEIGHTS = path.join(getModelDir(modelId), 'model_final.pth');
    }
    
    cfg.SOLVER.IMS_PER_BATCH = 4;
    cfg.SOLVER.BASE_LR = baseLearningRate;
    cfg.SOLVER.NUM_GPUS = numGpus;
    cfg.SOLVER.MAX_ITER = maxIter;
    if (device === 'cpu') {
      cfg.MODEL.DEVICE = device;
    }
    
    cfg.MODEL.ROI_HEADS.BATCH_SIZE_PER_IMAGE = 128;
    cfg.MODEL.ROI_HEADS.NUM_CLASSES = Object.keys(data.metaData.label.valueMap).length;

    cfg.OUTPUT_DIR = path.join(process.cwd(), '.temp', 'output');
    
    python.print(cfg);

    os.makedirs(cfg.OUTPUT_DIR, _({"exist_ok": true}));
    if (data.trainData) {
      trainer = DefaultTrainer(cfg);
      if (modelId) {
        trainer.resume_or_load(_({"resume": true}));
      } else {
        trainer.resume_or_load(_({"resume": false}));
      }
    }
  });

  // to initialize prediction environment
  let torch: any;
  let config: any;
  await Python.scope('detectron_prediction', async (python: any) => {
    const _ = python.nA;
    torch = python.import('torch');
    const [get_cfg] = python.fromImport('detectron2.config', ['get_cfg']);

    config = get_cfg();
    config.merge_from_file(path.join(__dirname, 'config', 'faster_rcnn_R_50_C4_3x.yaml'));
    if (!modelId) {
      config.MODEL.WEIGHTS = path.join(process.cwd(), '.temp', 'output', 'model_final.pth');
    } else {
      config.MODEL.WEIGHTS = path.join(getModelDir(modelId), 'model_final.pth');
    }
    
    config.MODEL.ROI_HEADS.NUM_CLASSES = Object.keys(data.metaData.label.valueMap).length;
    if (device === 'cpu') {
      config.MODEL.DEVICE = device;
    }  
  })

  return {
    model: trainer,
    type: 'object detection',
    inputShape: [-1, -1, 3],
    outputShape: [],
    inputType: 'float32',
    outputType: 'int32',
    metrics: [],
    save: async function(modelPath: string) {
      fs.copySync(path.join(process.cwd(), '.temp', 'output'), modelPath);
      fs.copySync(path.join(__dirname, 'config'), path.join(modelPath, 'config'));
    },
    predict: async function (inputData: string[]) {
      let prediction: any;
      await Python.scope('detectron_prediction', async (python: any) => {
        const [DefaultPredictor] = python.fromImport('detectron2.engine.defaults', ['DefaultPredictor']);
        const predictor = DefaultPredictor(config);
        const cv2 = python.import('cv2');
        const numpy = python.import('numpy');
        const images = inputData.map((data: string) => {
          return cv2.imread(data)
        })
        const img = numpy.array(images);
        const out = predictor(img)
        const ins = python.runRaw(`${Python.convert(out)}['instances'].to(${Python.convert(torch)}.device('cpu'))`)
        const boxes = ins.pred_boxes.tensor.numpy()
        const scores = ins.scores.numpy()
        const classes = ins.pred_classes.numpy()

        const preds = python.runRaw(`
          [{
            'label': cl,
            'score': float(score),
            'type': 'baseComponent',
            'rect': {
                'x': int(bbox[0]+0.5),
                'y': int(bbox[1]+0.5),
                'width': int(bbox[2] - bbox[0] + 0.5),
                'height': int(bbox[3] - bbox[1] + 0.5)
            }
          } for (bbox, score, cl) in zip(${Python.convert(boxes)}, ${Python.convert(scores)}, ${Python.convert(classes)}) if score > 0.7]
        `);

        prediction = await python.evaluate(preds);
      });

      return prediction.value;
    },
    modelName: (<string>(args.modelName)),
    config: cfg,
    extraParams: {
      detectronConfigPath: path.join(__dirname, 'config'),
      modelPath: modelId ? path.join(getModelDir(modelId), 'model_final.pth') : path.join(process.cwd(), '.temp', 'output', 'model_final.pth')
    }
  }
}

export default imageDetectionModelLoad;