/**
 * This is an example Pipcook file. This pipeline is used to train the image classification task. We have several plugins used in this pipeline:
 * 
 * - imageClassDataCollect: used to collect the image classification data. This is a general-purpose image classification collect plugin.
 *   The user can specify the url of their own dataset instead of ours as long as the dataset conforms to the plugin's expectation. For more information
 *   of this plugin, Please refer to https://github.com/alibaba/pipcook/wiki/pipcook-plugins-image-class-data-collect
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

const {DataCollect, DataAccess, ModelLoad, ModelTrain, ModelEvaluate, PipcookRunner, ModelDeploy} = require('@pipcook/pipcook-core');

const imageClassDataAccess = require('@pipcook/pipcook-plugins-image-class-data-access').default;
const mobileNetLoad = require('@pipcook/pipcook-plugins-local-mobilenet-model-load').default;
const modelTrainPlugin = require('@pipcook/pipcook-plugins-model-train').default;
const modelEvalutePlugin = require('@pipcook/pipcook-plugins-model-evaluate').default;
const imageClassDataCollect = require('@pipcook/pipcook-plugins-image-class-data-collect').default
const imageModelDeploy = require('@pipcook/pipcook-plugins-image-class-local-model-deploy').default;

async function startPipeline() {
  // collect databinding data. To have a check of this dataset, please download from 
  // http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/eCommerceImageClassification.zip
  // you can replace it with your own data to do image classification. 
  const dataCollect = DataCollect(imageClassDataCollect, {
    url: 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/eCommerceImageClassification.zip'
  });
  
  // access image data into our specifiction
  const dataAccess = DataAccess(imageClassDataAccess, {
    imgSize:[256, 256],
  });

  // load mobile net model
  const modelLoad = ModelLoad(mobileNetLoad, {
    isFreeze: false
  });

  // train the model
  const modelTrain = ModelTrain(modelTrainPlugin, {
    epochs: 30
  });

  // evaluate the model
  const modelEvaluate = ModelEvaluate(modelEvalutePlugin);

  const modelDeploy = ModelDeploy(imageModelDeploy);

  const runner = new PipcookRunner('pipeline-example-databinding-image-classification', {
    predictServer: true
  });

  runner.run([dataCollect, dataAccess, modelLoad, modelTrain, modelEvaluate, modelDeploy])
}

startPipeline();