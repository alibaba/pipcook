const {DataCollect, DataAccess, DataProcess, ModelLoad, ModelTrain, ModelEvaluate, ModelDeploy, PipcookRunner, DataMerge} = require('../packages/pipcook-core');

const textClassDataAccess = require('../packages/pipcook-plugins-text-csv-data-access').default;
const textClassDataProcess = require('../packages/pipcook-plugins-text-class-data-process').default
const bayesianClassiferModelLoader = require('../packages/pipcook-plugins-bayesian-classfier-model-load').default;
const bayesianClassifierModelTrain = require('../packages/pipcook-plugins-bayesian-classifier-model-train').default;
const classModelEvalute = require('../packages/pipcook-plugins-model-evaluate').default;
const textClassDataCollect = require('../packages/pipcook-plugins-text-class-data-collect').default;



async function pipeLine() {
  
  const dataCollect = DataCollect(textClassDataCollect, {
    url: 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textDataBinding.csv',
    validationSplit:0.1,
    testSplit:0.1
  })

  const dataAccess = DataAccess(textClassDataAccess);

  const dataProcess = DataProcess(textClassDataProcess);

  const modelLoad = ModelLoad(bayesianClassiferModelLoader, {
    modelName: 'testModelName'
  });

  const modelTrain = ModelTrain(bayesianClassifierModelTrain);

  const modelEvaluate = ModelEvaluate(classModelEvalute);

  const runner = new PipcookRunner('test2', {
    predictServer: true
  });

  runner.run([dataCollect, dataAccess, dataProcess, modelLoad, modelTrain, modelEvaluate])
}

pipeLine();