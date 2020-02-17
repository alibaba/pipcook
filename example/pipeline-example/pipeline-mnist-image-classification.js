/**
 * This is an example Pipcook file. This pipeline is used to train the image classification task of mnist image data. 
 * We have several plugins used in this pipeline:
 * 
 * - imageMnistDataCollection: used to collect the mnist data specifically. For more information
 *   of this plugin, Please refer to https://github.com/alibaba/pipcook/wiki/pipcook-plugins-image-mnist-data-collect
 * 
 * - imageClassDataAccess: used to access the expected image dataset format (PASCOL VOC) and access these images into the pipeline. This is the uniform data
 *   access plugin for image and make sure that pipcook has uniform dataset that can be published and communicated later in data world. For more information
 *   about this plugin, Please refer to https://github.com/alibaba/pipcook/wiki/pipcook-plugins-image-class-data-access
 * 
 * - mobileNetLoad: used to load the mobile net specifically. For more information about this plguin ,Please refer to
 *   https://github.com/alibaba/pipcook/wiki/pipcook-plugins-local-mobilenet-model-load
 * 
 * - modelTrainPlugin: uesd to train the model. Currently it supports models of tf.LayersModel. For more information, Please refer to 
 *   https://github.com/alibaba/pipcook/wiki/pipcook-plugins-model-train
 * 
 * - modelEvaluatePlugin: used to evaluate the model. Currently it supports models of tf.LayersModel and classification model which implements
 *   predict interface we defined for model. For more information, Please refer to https://github.com/alibaba/pipcook/wiki/pipcook-plugins-model-evaluate
 * 
 */
let {DataCollect, DataAccess, ModelLoad, ModelTrain, ModelEvaluate, PipcookRunner, ModelDeploy} = require('@pipcook/pipcook-core');

let imageClassDataAccess = require('@pipcook/pipcook-plugins-image-class-data-access').default;
let simpleCnnModelLoad = require('@pipcook/pipcook-plugins-simple-cnn-model-load').default;
let imageClassModelTrain = require('@pipcook/pipcook-plugins-model-train').default;
let classModelEvalute = require('@pipcook/pipcook-plugins-model-evaluate').default;
let imageMnistDataCollection = require('@pipcook/pipcook-plugins-image-mnist-data-collect').default
let imageClassLocalModelDeploy = require('@pipcook/pipcook-plugins-image-class-local-model-deploy').default;

async function startPipeline() {
  // collect mnist data
  const dataCollect = DataCollect(imageMnistDataCollection, {
    trainingCount:200,
    testCount: 200
  });
  
  // access mnist data into our specifiction
  const dataAccess = DataAccess(imageClassDataAccess, {
    imgSize:[28, 28],
  });

  // load mobile net model
  const modelLoad = ModelLoad(simpleCnnModelLoad, {
  });

  // train the model
  const modelTrain = ModelTrain(imageClassModelTrain, {
    epochs: 20
  });

  // evaluate the model
  const modelEvaluate = ModelEvaluate(classModelEvalute);

  // deploy to local
  const modelDeploy = ModelDeploy(imageClassLocalModelDeploy);

  const runner = new PipcookRunner({
    predictServer: true
  });

  runner.run([dataCollect, dataAccess, modelLoad, modelTrain, modelEvaluate, modelDeploy])
}

startPipeline();