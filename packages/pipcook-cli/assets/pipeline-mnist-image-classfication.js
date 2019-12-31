/**
 * This is an example Pipcook file. This pipeline is used to train the image classification task which is clasfici mnist recognition. 
 * We have several plugins used in this pipeline:
 * 
 * - imageClassDataCollect: used to collect the image classification data. This is a general-purpose image classification collect plugin.
 *   The user can specify the url of their own dataset instead of ours as long as the dataset conforms to the plugin's expectation. For more information
 *   of this plugin, Please refer to https://github.com/alibaba/pipcook/wiki/pipcook-plugins-image-mnist-data-collect
 * 
 * - imageClassDataAccess: used to access the expected image dataset format (PASCOL VOC) and access these images into the pipeline. This is the uniform data
 *   access plugin for image and make sure that pipcook has uniform dataset that can be published and communicated later in data world. For more information
 *   about this plugin, Please refer to https://github.com/alibaba/pipcook/wiki/pipcook-plugins-image-class-data-access
 * 
 * - simpleCnnModelLoad: used to load the a 5 conv cnn model specifically. For more information about this plguin ,Please refer to
 *   https://github.com/alibaba/pipcook/wiki/pipcook-plugins-simple-cnn-model-load
 * 
 * - modelTrainPlugin: uesd to train the model. Currently it supports models of tf.LayersModel. For more information, Please refer to 
 *   https://github.com/alibaba/pipcook/wiki/pipcook-plugins-model-train
 * 
 * - modelEvaluatePlugin: used to evaluate the model. Currently it supports models of tf.LayersModel and classification model which implements
 *   predict interface we defined for model. For more information, Please refer to https://github.com/alibaba/pipcook/wiki/pipcook-plugins-model-evaluate
 * 
 */
const {DataCollect, DataAccess, ModelLoad, ModelTrain, ModelEvaluate, PipcookRunner, ModelDeploy} = require('@pipcook/pipcook-core');

const imageClassDataAccess = require('@pipcook/pipcook-plugins-image-class-data-access').default;
const simpleCnnModelLoad = require('@pipcook/pipcook-plugins-simple-cnn-model-load').default;
const modelTrainPlugin = require('@pipcook/pipcook-plugins-model-train').default;
const modelEvalutePlugin = require('@pipcook/pipcook-plugins-model-evaluate').default;
const imageMnistDataCollection = require('@pipcook/pipcook-plugins-image-mnist-data-collect').default
const imageModelDeploy = require('@pipcook/pipcook-plugins-image-class-local-model-deploy').default;


async function startPipeline() {
  // collect mnist data
  const dataCollect = DataCollect(imageMnistDataCollection, {
    trainingCount:8000,
    testCount: 2000
  });
  
  // access mnist data into our specifiction
  const dataAccess = DataAccess(imageClassDataAccess, {
    imgSize:[28, 28],
  });

  // load mobile net model
  const modelLoad = ModelLoad(simpleCnnModelLoad, {
    modelName: 'test1'
  });

  // train the model
  const modelTrain = ModelTrain(modelTrainPlugin, {
    epochs: 15
  });

  // evaluate the model
  const modelEvaluate = ModelEvaluate(modelEvalutePlugin);

  const modelDeploy = ModelDeploy(imageModelDeploy);

  const runner = new PipcookRunner('pipeline-mnist-example', {
    predictServer: true
  });

  runner.run([dataCollect, dataAccess, modelLoad, modelTrain, modelEvaluate, modelDeploy])
}

startPipeline();