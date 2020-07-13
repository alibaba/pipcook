import React from 'react';
import { Button, Dialog, Tag } from '@alifd/next';

/**
 * Pipeline templates
 */
import ImageClassificationPipeline from '@/config/pipelines/image-classification.json';
import ObjectDetectionPipeline from '@/config/pipelines/object-detection.json';
import ImageStyleTransferPipeline from '@/config/pipelines/image-style-transfer.json';
import TextClassificationPipeline from '@/config/pipelines/text-classification.json';
import TextCreationPipeline from '@/config/pipelines/text-creation.json';

/**
 * !important: This File contains many information that should be returned by backend. For now, just remain these.
 * Todo: queyue.crk
 */

export const DATACOLLECT = 'dataCollect';
export const DATAACCESS = 'dataAccess';
export const DATAPROCESS = 'dataProcess';
export const MODELLOAD = 'modelLoad';
export const MODELDEFINE = 'modelDefine';
export const MODELTRAIN = 'modelTrain';
export const MODELEVALUATE = 'modelEvaluate';

export const PLUGINS = [{
  id: DATACOLLECT,
  title: 'Select a dataset',
}, {
  id: DATAACCESS,
  title: 'Access the dataset',
}, {
  id: DATAPROCESS,
  title: 'Process the sample',
}, {
  id: MODELLOAD,
  title: 'Load a model',
}, {
  id: MODELDEFINE,
  title: 'Define a model',
}, {
  id: MODELTRAIN,
  title: 'Train',
}, {
  id: MODELEVALUATE,
  title: 'Evaluate',
}];

export const PIPELINE_STATUS = ['INIT', 'RUNNING', 'SUCCESS', 'FAIL'];
export const PIPELINE_MAP = [
  {
    name: 'ID',
    width: 50,
    cell: (value, index, record) => {
      return <a href={`/index.html#/pipeline/info?pipelineId=${record.id}`}>
        {record.id.replace(/-/g, '').slice(0, 12)}
      </a>;
    },
  },
  {
    name: 'Dataset',
    width: 100,
    cell: (value, index, record) => {
      return <Tag size="small" type="normal">{record.dataCollect}</Tag>;
    },
  },
  {
    name: 'Model',
    width: 100,
    cell: (value, index, record) => {
      return <Tag size="small" type="normal">{record.modelDefine}</Tag>;
    },
  },
  {
    name: 'Jobs',
    cell: (value, index, record) => {
      return <span>{record.jobs.length}</span>;
    },
    width: 30,
  },
  {
    name: 'Created At',
    field: 'createdAt',
    width: 50,
    sortable: true,
  },
];

export const JOB_MAP = [
  {
    name: 'ID',
    width: 50,
    cell: (value, index, record) => {
      return <a href={`/index.html#/job/info?jobId=${record.id}`}>
        {record.id.replace(/-/g, '').slice(0, 12)}
      </a>;
    },
  },
  {
    name: 'Status',
    width: 50,
    cell: (value, index, record) => {
      const colors = {
        INIT: 'yellow',
        RUNNING: 'yellow',
        SUCCESS: 'green',
        FAIL: 'red',
      };
      return <Tag size="small" color={colors[record.status]}>{record.status}</Tag>;
    },
  },
  {
    name: 'Evaluation',
    width: 100,
    cell: (value, index, record) => {
      let result = null;
      if (record.evaluateMap) {
        result = JSON.parse(record.evaluateMap);
        if (result?.pass) {
          result.pass = undefined;
        }
      } else {
        return <span>no result</span>;
      }
      if (record.evaluatePass || record.evaluateMap) {
        const content = JSON.stringify(result, null, 2);
        const onClick = () => {
          Dialog.show({
            title: 'evaluation',
            content,
          });
        };
        return <Button size="small" onClick={onClick}>{content.slice(0, 40)}</Button>;
      } else {
        return <Tag size="small" color="red">{record.error}</Tag>;
      }
    },
  },
  {
    name: 'Pipeline',
    width: 50,
    cell: (value, index, record) => {
      return <a href={`/index.html#/pipeline/info?pipelineId=${record.pipelineId}`}>
        {record.id.replace(/-/g, '').slice(0, 12)}
      </a>;
    },
  },
  {
    name: 'End Time',
    width: 100,
    field: 'endTime',
  },
  {
    name: 'Model',
    width: 40,
    cell: (value, index, record) => {
      const download = () => {
        location.href = `/job/${record.id}/output.tar.gz`;
      };
      return <Button size="small" disabled={record.status !== 'SUCCESS'} onClick={download}>Download</Button>;
    },
  },
];

export const PIPELINE_TEMPLATES = [
  {
    title: 'Image Classification',
    category: 'vision',
    description: 'The image classification accepts the given input images and produces output for identifying whether the type is or not.',
    template: ImageClassificationPipeline
  },
  {
    title: 'Object Detection',
    category: 'vision',
    description: 'The object detection detects the given objects and returns class and position for each one.',
    template: ObjectDetectionPipeline
  },
  {
    title: 'Image Style Transfer',
    category: 'vision',
    description: 'The image style transfer generates an image automatically.',
    template: ImageStyleTransferPipeline
  },
  {
    title: 'Text Classification',
    category: 'nlp',
    description: 'The text classification does classify the text to specific classes.',
    template: TextClassificationPipeline
  },
  {
    title: 'Text Creation',
    category: 'nlp',
    description: 'The text creation generates an artwork by a given portfolio.',
    template: TextCreationPipeline
  }
];

const PLUGIN_LIST = {
  dataCollect: [
    '@pipcook/plugins-csv-data-collect',
    '@pipcook/plugins-image-classification-data-collect',
    '@pipcook/plugins-mnist-data-collect',
    '@pipcook/plugins-object-detection-coco-data-collect',
    '@pipcook/plugins-object-detection-pascalvoc-data-collect',
  ],
  dataAccess: [
    '@pipcook/plugins-coco-data-access',
    '@pipcook/plugins-csv-data-access',
    '@pipcook/plugins-pascalvoc-data-access',
  ],
  dataProcess: [
    '@pipcook/plugins-image-data-process',
  ],
  modelDefine: [
    '@pipcook/plugins-bayesian-model-define',
    '@pipcook/plugins-detectron-fasterrcnn-model-define',
    '@pipcook/plugins-tensorflow-resnet-model-define',
    '@pipcook/plugins-tfjs-mobilenet-model-define',
    '@pipcook/plugins-tfjs-simplecnn-model-define',
  ],
  modelTrain: [
    '@pipcook/plugins-bayesian-model-train',
    '@pipcook/plugins-image-classification-tensorflow-model-train',
    '@pipcook/plugins-image-classification-tfjs-model-train',
    '@pipcook/plugins-object-detection-detectron-model-train',
  ],
  modelEvaluate: [
    '@pipcook/plugins-bayesian-model-evaluate',
    '@pipcook/plugins-image-classification-tensorflow-model-evaluate',
    '@pipcook/plugins-image-classification-tfjs-model-evaluate',
    '@pipcook/plugins-object-detection-detectron-model-evaluate',
  ],
};

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
    './packages/plugins/data-process/image-data-process',
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
  ],
};

export const pluginList = DEV === 'TRUE' ? PLUGIN_LOCAL : PLUGIN_LIST;
