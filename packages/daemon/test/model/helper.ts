import { assert } from 'midway-mock/bootstrap';

export const pipelineData = {
  name: 'name',

  dataCollectId: 'dataCollectId',
  dataCollect: 'dataCollect',
  dataCollectParams: '{}',

  dataAccessId: 'dataAccessId',
  dataAccess: 'dataAccess',
  dataAccessParams: '{}',

  dataProcessId: 'dataProcessId',
  dataProcess: 'dataProcess',
  dataProcessParams: '{}',

  datasetProcessId: 'datasetProcessId',
  datasetProcess: 'datasetProcess',
  datasetProcessParams: '{}',

  modelDefineId: 'modelDefineId',
  modelDefine: 'modelDefine',
  modelDefineParams: '{}',

  modelLoadId: 'modelLoadId',
  modelLoad: 'modelLoad',
  modelLoadParams: '{}',

  modelTrainId: 'modelTrainId',
  modelTrain: 'modelTrain',
  modelTrainParams: '{}',

  modelEvaluateId: 'modelEvaluateId',
  modelEvaluate: 'modelEvaluate',
  modelEvaluateParams: '{}'
};

export const anotherPipelineData = {
  ...pipelineData,
  name: 'anotherName'
};

export const pluginData = {
  name: 'name',
  version: 'version',
  category: 'categoryA',
  datatype: 'datatypeA',
  dest: 'dest',
  sourceFrom: 'sourceFrom',
  sourceUri: 'sourceUri',
  status: 0,
  error: 'error',
  namespace: 'namespace'
};

export const anotherPluginData = {
  ...pluginData,
  name: 'anotherName',
  category: 'categoryB',
  datatype: 'datatypeB'
};

export const jobData = {
  pipelineId: 'mockPipelineId',
  specVersion: '1.0',
  metadata: null,

  evaluateMap: null,
  evaluatePass: null,
  currentIndex: -1,
  error: null,
  endTime: null,
  params: [],
  status: 0,
  dataset: null
}

export const anotherJobData = {
  pipelineId: 'mockPipelineId',
  specVersion: '2.0',
  metadata: '{"testAnotherMetaData": "123"}',

  evaluateMap: '{}',
  evaluatePass: false,
  currentIndex: -2,
  error: 'error msg',
  endTime: Date.now(),
  params: [],
  status: 1,
  dataset: 'dataset'
}

export function deepEqualEntity(entity, originData, msg = 'entity check') {
  entity['createdAt'] && delete entity['createdAt'];
  entity['updatedAt'] && delete entity['updatedAt'];
  assert.deepStrictEqual(entity, originData, msg);
}
