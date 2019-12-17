let {DataCollect, DataAccess, ModelLoad, ModelTrain, ModelEvaluate, PipcookRunner} = require('../packages/pipcook-core');

let imageCocoDataCollect = require('../packages/pipcook-plugins-image-coco-data-collect').default;
let imageDetectronAccess = require('../packages/pipcook-plugins-detection-detectron-data-access').default;
let detectronModelLoad = require('../packages/pipcook-plugins-detection-detectron-model-load').default;
let detectronModelTrain = require('../packages/pipcook-plugins-detection-detectron-model-train').default;
let detectronModelEvaluate = require('../packages/pipcook-plugins-detection-detectron-model-evaluate').default;

async function startPipeline() {
   // collect detection data
   const dataCollect = DataCollect(imageCocoDataCollect, {
    url: 'xxx',
    testSplit: 0.1,
    annotationFileName: 'annotation.json'
  });
  
  // access detection data into our specifiction
  const dataAccess = DataAccess(imageDetectronAccess);

  // load mobile net model
  const modelLoad = ModelLoad(detectronModelLoad, {
    modelName: 'test1'
  });

  // train the model
  const modelTrain = ModelTrain(detectronModelTrain);

  // evaluate the model
  const modelEvaluate = ModelEvaluate(detectronModelEvaluate);

  const runner = new PipcookRunner('test1', {
    predictServer: true
  });

  runner.run([dataCollect, dataAccess, modelLoad, modelTrain, modelEvaluate])

}

startPipeline();