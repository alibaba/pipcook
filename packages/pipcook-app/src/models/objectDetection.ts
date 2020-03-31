
import { DataCollect, DataAccess, ModelLoad, ModelTrain, ModelEvaluate, PipcookRunner, ModelDeploy, downloadZip } from '@pipcook/pipcook-core';

import imageCocoDataCollect from '@pipcook/pipcook-plugins-image-coco-data-collect';
import imageDetectronAccess from '@pipcook/pipcook-plugins-detection-detectron-data-access';
import detectronModelLoad from '@pipcook/pipcook-plugins-detection-detectron-model-load';
import detectronModelTrain from '@pipcook/pipcook-plugins-detection-detectron-model-train';
import detectronModelEvaluate from '@pipcook/pipcook-plugins-detection-detectron-model-evaluate';
import easModelDeploy from '@pipcook/pipcook-plugins-detection-detectron-eas-model-deploy';
import detectronLocalDeploy from '@pipcook/pipcook-plugins-detection-detectron-model-deploy';
import * as fs from 'fs-extra';
import * as path from 'path';

import { getEasParam, EasConfigI } from '../utils/utils';

export interface MetaDataI {
  device?: 'cpu' | 'gpu';
  baseLearningRate?: number;
  numWorkers?: number;
  maxIter?: number;
  numGpus?: number;
}

export interface TrainInfoI {
  testSplit?: number;
  annotationFileName: string;
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

  async _train(dataSource: string, trainInfo: TrainInfoI, ) {
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
      numGpus: this.metaData.numGpus
    });

    const modelTrain = ModelTrain(detectronModelTrain);

    const modelEvaluate = ModelEvaluate(detectronModelEvaluate);

    return { dataCollect, dataAccess, modelLoad, modelTrain, modelEvaluate };
  }

  async train(dataSource: string, trainInfo: TrainInfoI, 
    predictServer = false, successCallback?: Function, errorCallback?: Function, saveModelCallback?: Function) {
    
    const { dataCollect, dataAccess, modelLoad, modelTrain, modelEvaluate } = await this._train(dataSource, trainInfo);

    const modelDeploy = ModelDeploy(detectronLocalDeploy);
    
    const runner = new PipcookRunner();

    runner.run([ dataCollect, dataAccess, modelLoad, modelTrain, modelEvaluate, modelDeploy ], successCallback, errorCallback, saveModelCallback);
    
  }


  async deployEasByUrl(modelUrl: string, labelJsonUrl: string, easConfig: EasConfigI) {
    const tempPth = path.join(process.cwd(), '.temp', Date.now().toString());
    try {
      const modelPath = path.join(tempPth, 'model_final.pth');
      const labelJsonPath = path.join(tempPth, 'valueMap.json');
      await downloadZip(modelUrl, modelPath);
      await downloadZip(labelJsonUrl, labelJsonPath);
      const valueMap = require(labelJsonPath);
      await easModelDeploy({
        metaData: {
          label: {
            valueMap
          }
        }
      }, {
        extraParams: {
          modelPath,
          detectronConfigPath: path.join(__dirname, '..', 'assets', 'config')
        }
      }, getEasParam(easConfig));
    } finally {
      fs.removeSync(tempPth);
    }
  }

  async trainAndEasDeploy(dataSource: string, trainInfo: TrainInfoI, easConfig: EasConfigI,
    predictServer = false, successCallback?: Function, errorCallback?: Function, saveModelCallback?: Function) {

    const { dataCollect, dataAccess, modelLoad, modelTrain, modelEvaluate } = await this._train(dataSource, trainInfo);

    const modelDeploy = ModelDeploy(easModelDeploy, getEasParam(easConfig));
    
    const runner = new PipcookRunner();

    runner.run([ dataCollect, dataAccess, modelLoad, modelTrain, modelEvaluate, modelDeploy ], successCallback, errorCallback, saveModelCallback);
    
  }
}
