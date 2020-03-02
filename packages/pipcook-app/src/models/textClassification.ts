
import {DataCollect, DataAccess, ModelLoad, ModelTrain, ModelEvaluate, PipcookRunner, ModelDeploy, downloadZip} from '@pipcook/pipcook-core';

import textClassDataCollect from '@pipcook/pipcook-plugins-text-class-data-collect';
import textClassDataAccess from '@pipcook/pipcook-plugins-text-csv-data-access';
import bayesianClassiferModelLoader from '@pipcook/pipcook-plugins-bayesian-classifier-model-load';
import bayesianClassifierModelTrain from '@pipcook/pipcook-plugins-bayesian-classifier-model-train';
import classModelEvalute from '@pipcook/pipcook-plugins-bayesian-classifier-model-evaluate';
import textClassLocalModelDeploy from '@pipcook/pipcook-plugins-text-class-local-model-deploy';
import textClassEasDeploy from '@pipcook/pipcook-plugins-bayesian-classifier-model-eas-deploy'

import { getEasParam, EasConfigI } from '../utils/utils';

export default class TextClassification {

  model: string;
  metaData: any;
  modelId: string;

  constructor(model: string, metaData?: any, modelId?: string) {
    this.model = model;
    this.metaData = metaData;
    if (modelId) {
      this.modelId = modelId;
    }
  }

  async _train(dataSource: string, trainInfo: any) {
    const dataCollect = DataCollect(textClassDataCollect, {
      url: dataSource
    })
  
    const dataAccess = DataAccess(textClassDataAccess);
  
    const modelLoad = ModelLoad(bayesianClassiferModelLoader);
  
    const modelTrain = ModelTrain(bayesianClassifierModelTrain);
  
    const modelEvaluate = ModelEvaluate(classModelEvalute);

    return {dataCollect, dataAccess, modelLoad, modelTrain, modelEvaluate};
  }

  async train(dataSource: string, trainInfo: any, 
    predictServer=false, successCallback?: Function, errorCallback?: Function, saveModelCallback?: Function) {
    
    const {dataCollect, dataAccess, modelLoad, modelTrain, modelEvaluate} = await this._train(dataSource, trainInfo);

    const modelDeploy = ModelDeploy(textClassLocalModelDeploy)
    
    const runner = new PipcookRunner({
      predictServer
    });

    runner.run([dataCollect, dataAccess, modelLoad, modelTrain, modelEvaluate, modelDeploy], successCallback, errorCallback, saveModelCallback)
    
  }

  async trainAndEasDeploy(dataSource: string, trainInfo: any, easConfig: EasConfigI,
     predictServer=false, successCallback?: Function, errorCallback?: Function, saveModelCallback?: Function) {

    const {dataCollect, dataAccess, modelLoad, modelTrain, modelEvaluate} = await this._train(dataSource, trainInfo);

    const modelDeploy = ModelDeploy(textClassEasDeploy, getEasParam(easConfig));
    
    const runner = new PipcookRunner({
      predictServer
    });

    runner.run([dataCollect, dataAccess, modelLoad, modelTrain, modelEvaluate, modelDeploy], successCallback, errorCallback, saveModelCallback)
    
  }
}