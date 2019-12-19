import {ModelLoadType, PipcookModel, UniformGeneralSampleData, getOsInfo, getModelDir} from '@pipcook/pipcook-core';
import {Python} from '@pipcook/pipcook-python-node';
import * as assert from 'assert';
import * as path from 'path';
import * as tf from '@tensorflow/tfjs-node-gpu';

const fs = require('fs-extra');

const imageDetectionModelLoad: ModelLoadType = async (data: UniformGeneralSampleData, args?: any): Promise<PipcookModel> => {
  const system = await getOsInfo();

  const {
    device='cpu',
    modelId=''
  } = args || {};

  let trainer: any;
  let cfg: any;

  if (!modelId) {
    assert.ok(args && args.modelName, 'Please give your model a name');
  }
  
  await Python.scope('detectron', async (python: any) => {
    const _ = python.nA;
    python.runshell('pip install torch torchvision --no-cache-dir ');
    python.runshell('pip install opencv-python --no-cache-dir ');
    python.runshell(`pip install -U 'git+https://github.com/facebookresearch/fvcore' --no-cache-dir `)
    python.runshell('pip install cython --no-cache-dir ');
    python.runshell(`pip install 'git+https://github.com/cocodataset/cocoapi.git#subdirectory=PythonAPI' --no-cache-dir `);
    python.runshell(`git clone https://github.com/facebookresearch/detectron2.git`);

    if (system === 'mac') {
      python.runshell('cd detectron2 && MACOSX_DEPLOYMENT_TARGET=10.9 CC=clang CXX=clang++ python setup.py build develop');
    } else {
      python.runshell('cd detectron2 && python setup.py build develop');
    }

    await python.reconnect();

    const [register_coco_instances] = python.fromImport('detectron2.data.datasets', ['register_coco_instances']);
    const [DefaultTrainer, hooks] = python.fromImport('detectron2.engine', ['DefaultTrainer', 'hooks']);
    const [get_cfg] = python.fromImport('detectron2.config', ['get_cfg']);
    const os = python.import('os');
    const [setup_logger] = python.fromImport('detectron2.utils.logger', ['setup_logger']);

    setup_logger()

    const validationData = data.validationData || data.testData;
    register_coco_instances("train_dataset", {}, data.trainData, path.join(data.trainData, '..', '..' , 'images'))
    if (validationData) {
      register_coco_instances("val_dataset", {}, validationData, path.join(validationData, '..', '..' , 'images'))
    }

    cfg = get_cfg();
    cfg.merge_from_file(path.join(__dirname, 'config', 'faster_rcnn_R_50_C4_3x.yaml'));
    cfg.DATASETS.TRAIN = python.createList(["train_dataset"]);
    if (validationData) {
      cfg.DATASETS.TEST = python.createList(['val_dataset']);
    }

    cfg.DATALOADER.NUM_WORKERS = 4;
    cfg.MODEL.WEIGHTS = "detectron2://ImageNetPretrained/MSRA/R-50.pkl";
    cfg.SOLVER.IMS_PER_BATCH = 4;
    cfg.SOLVER.BASE_LR = 0.000025;
    cfg.SOLVER.NUM_GPUS = 2;
    cfg.SOLVER.MAX_ITER = 100000;
    if (device === 'cpu') {
      cfg.MODEL.DEVICE = device;
    }
    
    cfg.MODEL.ROI_HEADS.BATCH_SIZE_PER_IMAGE = 128;
    cfg.MODEL.ROI_HEADS.NUM_CLASSES = Object.keys(data.metaData.label.valueMap).length;

    if (!modelId) {
      cfg.OUTPUT_DIR = path.join(process.cwd(), '.temp', 'output');
    } else {
      cfg.OUTPUT_DIR = getModelDir(modelId);
    }
    

    os.makedirs(cfg.OUTPUT_DIR, _({"exist_ok": true}));
    trainer = DefaultTrainer(cfg);
    trainer.resume_or_load(_({"resume": true}));
  });

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
    },
    predict: async function (inputData: tf.Tensor<any>) {
      let prediction: any;
      Python.scope('detectron_prediction', async (python: any) => {
        const _ = python.nA;
        const torch = python.import('torch');
        const [get_cfg] = python.fromImport('detectron2.config', ['get_cfg']);
        const [DefaultPredictor] = python.fromImport('detectron2.engine.defaults', ['DefaultPredictor']);        
    
        cfg = get_cfg();
        cfg.merge_from_file(path.join(__dirname, 'config', 'faster_rcnn_R_50_C4_3x.yaml'));
        if (!modelId) {
          cfg.MODEL.WEIGHTS = path.join(process.cwd(), '.temp', 'output', 'model_final.pth');
        } else {
          cfg.MODEL.WEIGHTS = path.join(getModelDir(modelId), 'model_final.pth');
        }
        
        cfg.MODEL.ROI_HEADS.NUM_CLASSES = Object.keys(data.metaData.label.valueMap).length;
        if (device === 'cpu') {
          cfg.MODEL.DEVICE = device;
        }
        cfg.INPUT.FORMAT = 'RGB';
    
        const model = DefaultPredictor(cfg)
        const img = python.createNumpyFromTf(inputData);
        const out = model(img)
        const ins = out['instances'].to(torch.device('cpu'))
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
          } for (bbox, score, cl) in zip(${python.convert(boxes)}, ${python.convert(scores)}, ${python.convert(classes)}) if score > 0.7]
        `);

        prediction = await python.evaluate(preds);
      });

      return prediction;
    },
    modelName: (<string>(args.modelName)),
    modelPath: path.join(process.cwd(), '.temp', 'output'), 
    config: cfg,
  }
}

export default imageDetectionModelLoad;