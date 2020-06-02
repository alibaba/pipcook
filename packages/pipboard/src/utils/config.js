export const DATACOLLECT = 'dataCollect';
export const DATAACCESS = 'dataAccess';
export const DATAPROCESS = 'dataProcess';
export const MODELLOAD = 'modelLoad';
export const MODELDEFINE = 'modelDefine';
export const MODELTRAIN = 'modelTrain';
export const MODELEVALUATE = 'modelEvaluate';
export const PLUGINS = [
  DATACOLLECT,
  DATAACCESS,
  DATAPROCESS,
  MODELLOAD,
  MODELDEFINE,
  MODELTRAIN,
  MODELEVALUATE
];

export const PIPELINE_MAP = [
  {
    name: 'Pipeline Id',
    field: 'id'
  },
  {
    name: 'Data Collect',
    field: 'dataCollect'
  },
  {
    name: 'Data Access',
    field: 'dataAccess'
  },
  {
    name: 'Data Process',
    field: 'dataProcess'
  },
  {
    name: 'Model Define',
    field: 'modelDefine'
  },
  {
    name: 'Model Load',
    field: 'modelLoad'
  },
  {
    name: 'Model Train',
    field: 'modelTrain'
  },
  {
    name: 'Model Evaluate',
    field: 'modelEvaluate'
  },
  {
    name: 'Created At',
    field: 'createdAt'
  },
]

export const JOB_MAP = [
  {
    name: 'Job Id',
    field: 'id'
  },
  {
    name: 'Status',
    field: 'status'
  },
  {
    name: 'Evaluate Pass',
    field: 'evaluatePass'
  },
  {
    name: 'Error',
    field: 'error'
  },
  {
    name: 'End Time',
    field: 'endTime'
  },
  {
    name: 'Spec Version',
    field: 'specVersion'
  }
];

export const pluginList = {
  dataCollect: [
    '@pipcook/plugins-csv-data-collect',
    '@pipcook/plugins-image-classification-data-collect',
    '@pipcook/plugins-mnist-data-collect',
    '@pipcook/plugins-object-detection-coco-data-collect',
    '@pipcook/plugins-object-detection-pascalvoc-data-collect'
  ],
  dataAccess: [
    '@pipcook/plugins-coco-data-access',
    '@pipcook/plugins-csv-data-access',
    '@pipcook/plugins-pascalvoc-data-access'
  ],
  dataProcess: [
    '@pipcook/plugins-image-data-process'
  ],
  modelDefine: [
    '@pipcook/plugins-bayesian-model-define',
    '@pipcook/plugins-detectron-fasterrcnn-model-define',
    '@pipcook/plugins-tensorflow-resnet-model-define',
    '@pipcook/plugins-tfjs-mobilenet-model-define',
    '@pipcook/plugins-tfjs-simplecnn-model-define'
  ],
  modelTrain: [
    '@pipcook/plugins-bayesian-model-train',
    '@pipcook/plugins-image-classification-tensorflow-model-train',
    '@pipcook/plugins-image-classification-tfjs-model-train',
    '@pipcook/plugins-object-detection-detectron-model-train'
  ],
  modelEvaluate: [
    '@pipcook/plugins-bayesian-model-evaluate',
    '@pipcook/plugins-image-classification-tensorflow-model-evaluate',
    '@pipcook/plugins-image-classification-tfjs-model-evaluate',
    '@pipcook/plugins-object-detection-detectron-model-evaluate'
  ]
}