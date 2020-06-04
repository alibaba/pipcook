import React from 'react';
import { Button, Dialog } from '@alifd/next';

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

export const PIPELINE_STATUS = ['INIT', 'RUNNING', 'SUCCESS', 'FAIL'];

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
  {
    name: 'Detail',
    cell: (value, index, record) => {
      return <a href={`/index.html#/pipeline/info?pipelineId=${record.id}`}><Button>Detail</Button></a>
    }
  }
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
    cell: (value, index, record) => {
      return record.evaluateMap ? <Button onClick={
        () => {Dialog.show({title: 'evaluate pass', content: record.evaluateMap})}
      }>Check</Button> : 'no evaluateMap'
    }
  },
  {
    name: 'Spec Version',
    field: 'specVersion'
  },
  {
    name: 'Error',
    cell: (value, index, record) => {
      return record.error ? <Button onClick={
        () => {Dialog.show({title: 'error', content: record.error})}
      }>Check</Button> : 'no error'
    }
  },
  {
    name: 'End Time',
    field: 'endTime'
  },
  {
    name: 'Check Pipeline',
    cell: (value, index, record) => {
      return <a href={`/index.html#/pipeline/info?pipelineId=${record.pipelineId}&jobId=${record.id}`}><Button>Detail</Button></a>
    }
  }
];

const PLUGIN_LIST = {
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

const PLUGIN_LOCAL = {
  dataCollect: [
    './packages/plugins/data-collect/csv-data-collect',
    './packages/plugins/data-collect/image-classification-data-collect',
    './packages/plugins/data-collect/mnist-data-collect',
    './packages/plugins/data-collect/object-detection-coco-data-collect',
    './packages/plugins/data-collect/object-detection-pascolvoc-data-collect',
  ],
  dataAccess: [
    './packages/plugins/data-access/coco-data-access',
    './packages/plugins/data-access/csv-data-access',
    './packages/plugins/data-access/pascalvoc-data-access',
  ],
  dataProcess: [
    './packages/plugins/data-process/image-data-process'
  ],
  modelDefine: [
    './packages/plugins/model-define/bayesian-model-define',
    './packages/plugins/model-define/detectron-fasterrcnn-model-define',
    './packages/plugins/model-define/tensorflow-resnet-model-define',
    './packages/plugins/model-define/tfjs-mobilenet-model-define',
    './packages/plugins/model-define/tfjs-simplecnn-model-define',
  ],
  modelTrain: [
    './packages/plugins/model-train/bayesian-model-train',
    './packages/plugins/model-train/image-classification-tensorflow-model-train',
    './packages/plugins/model-train/image-classification-tfjs-model-train',
    './packages/plugins/model-train/object-detection-detectron-model-train',
  ],
  modelEvaluate: [
    './packages/plugins/model-evaluate/bayesian-model-evaluate',
    './packages/plugins/model-evaluate/image-classification-tensorflow-model-evaluate',
    './packages/plugins/model-evaluate/image-classification-tfjs-model-evaluate',
    './packages/plugins/model-evaluate/object-detection-detectron-model-evaluate',
  ]
}

export const pluginList = DEV === 'TRUE' ? PLUGIN_LOCAL : PLUGIN_LIST;