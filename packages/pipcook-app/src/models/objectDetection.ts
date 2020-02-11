
import {DataCollect, DataAccess, ModelLoad, ModelTrain, ModelEvaluate, PipcookRunner, ModelDeploy} from '@pipcook/pipcook-core';

import imageCocoDataCollect from '@pipcook/pipcook-plugins-image-coco-data-collect';
import imageDetectronAccess from '@pipcook/pipcook-plugins-detection-detectron-data-access';
import detectronModelLoad from '@pipcook/pipcook-plugins-detection-detectron-model-load';
import detectronModelTrain from '@pipcook/pipcook-plugins-detection-detectron-model-train';
import detectronModelEvaluate from '@pipcook/pipcook-plugins-detection-detectron-model-evaluate';
import easModelDeploy from '@pipcook/pipcook-plugins-detection-detectron-eas-model-deploy';
import detectronLocalDeploy from '@pipcook/pipcook-plugins-detection-detectron-model-deploy'

export interface MetaDataI {
  device?: 'cpu' | 'gpu',
  baseLearningRate?: number,
  numWorkers?: number,
  maxIter?: number,
  numGpus?: number,
}

export interface TrainInfoI {
  testSplit?: number,
  annotationFileName: string;
}

export interface EasConfigI {
  easName: string;
  cpus: number;
  memory: number;
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  ossDir: string;
  gpu?: number;
  resource?: string;
  eascmd?: string;
  envPackName?: string;
  envScriptName?: string;
}

export default class ObjectDetection {

  model: string;
  metaData: MetaDataI;
  modelId: string;

  constructor(model: string, metaData: MetaDataI, modelId?: string) {
    this.model = model;
    this.metaData = metaData;
    if (modelId) {
      this.modelId = modelId;
    }
  }

  async train(dataSource: string, trainInfo: TrainInfoI, 
    predictServer=false, successCallback?: Function, errorCallback?: Function, saveModelCallback?: Function) {
    const dataCollect = DataCollect(imageCocoDataCollect, {
      url: dataSource,
      testSplit: trainInfo.testSplit || '0.1',
      annotationFileName: trainInfo.annotationFileName || 'annotation.json'
    });
    
    const dataAccess = DataAccess(imageDetectronAccess);

    const modelLoad = ModelLoad(detectronModelLoad, {
      device: this.metaData.device || 'cpu',
      maxIter: this.metaData.maxIter,
      baseLearningRate: this.metaData.baseLearningRate,
      numWorkers: this.metaData.numWorkers,
      numGpus: this.metaData.numGpus,
    });

    const modelTrain = ModelTrain(detectronModelTrain);

    const modelEvaluate = ModelEvaluate(detectronModelEvaluate);

    const modelDeploy = ModelDeploy(detectronLocalDeploy)
    
    const runner = new PipcookRunner({
      predictServer
    });

    runner.run([dataCollect, dataAccess, modelLoad, modelTrain, modelEvaluate, modelDeploy], successCallback, errorCallback, saveModelCallback)
    
  }

  async trainAndEasDeploy(dataSource: string, trainInfo: TrainInfoI, easConfig: EasConfigI,
     predictServer=false, successCallback?: Function, errorCallback?: Function, saveModelCallback?: Function) {
    const dataCollect = DataCollect(imageCocoDataCollect, {
      url: dataSource,
      testSplit: trainInfo.testSplit || '0.1',
      annotationFileName: trainInfo.annotationFileName || 'annotation.json'
    });
    
    const dataAccess = DataAccess(imageDetectronAccess);

    const modelLoad = ModelLoad(detectronModelLoad, {
      device: this.metaData.device || 'cpu',
      maxIter: this.metaData.maxIter,
      baseLearningRate: this.metaData.baseLearningRate,
      numWorkers: this.metaData.numWorkers,
      numGpus: this.metaData.numGpus,
    });

    const modelTrain = ModelTrain(detectronModelTrain);

    const modelEvaluate = ModelEvaluate(detectronModelEvaluate);

    const modelDeploy = ModelDeploy(easModelDeploy, {
      easName:easConfig.easName, 
      cpus: easConfig.cpus, 
      memory: easConfig.memory, 
      ossConfig: {
        region: easConfig.region,
        accessKeyId: easConfig.accessKeyId,
        accessKeySecret: easConfig.accessKeySecret,
        bucket: easConfig.bucket
      }, 
      ossDir: easConfig.ossDir,
      gpu: easConfig.gpu, 
      resource: easConfig.resource,
      eascmd: easConfig.eascmd,
      envPackName: easConfig.envPackName,
      envScriptName: easConfig.envScriptName
    });
    
    const runner = new PipcookRunner({
      predictServer
    });

    runner.run([dataCollect, dataAccess, modelLoad, modelTrain, modelEvaluate, modelDeploy], successCallback, errorCallback, saveModelCallback)
    
  }
}