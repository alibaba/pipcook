const {DataCollect, DataAccess, DataProcess, ModelLoad, ModelTrain, ModelEvaluate, ModelDeploy, PipcookRunner} = require('@pipcook/pipcook-core');

const textClassDataAccess = require('@pipcook/pipcook-plugins-text-csv-data-access').default;
const bayesianClassiferModelLoader = require('@pipcook/pipcook-plugins-bayesian-classifier-model-load').default;
const bayesianClassifierModelTrain = require('@pipcook/pipcook-plugins-bayesian-classifier-model-train').default;
const classModelEvalute = require('@pipcook/pipcook-plugins-bayesian-classifier-model-evaluate').default;
const textClassDataCollect = require('@pipcook/pipcook-plugins-text-class-data-collect').default;
const textClassLocalModelDeploy = require('@pipcook/pipcook-plugins-text-class-local-model-deploy').default;


async function pipeLine() {
  
  const dataCollect = DataCollect(textClassDataCollect, {
    url: 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textDataBinding.csv',
    validationSplit:0.1,
    testSplit:0.1
  })

  const dataAccess = DataAccess(textClassDataAccess);

  const modelLoad = ModelLoad(bayesianClassiferModelLoader, {
  });

  const modelTrain = ModelTrain(bayesianClassifierModelTrain);

  const modelEvaluate = ModelEvaluate(classModelEvalute);

  const modelDeploy = ModelDeploy(textClassLocalModelDeploy);

  const runner = new PipcookRunner({
    predictServer: true
  });

  runner.run([dataCollect, dataAccess, modelLoad, modelTrain, modelEvaluate, modelDeploy])
}

pipeLine();