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

let {DataCollect, DataAccess, ModelLoad, ModelTrain, ModelEvaluate, PipcookRunner} = require('../packages/pipcook-core');

let imageClassDataAccess = require('../packages/pipcook-plugins-image-class-data-access').default;
let mobileNetLoad = require('../packages/pipcook-plugins-local-mobileNet-model-load').default;
let modelTrainPlugin = require('../packages/pipcook-plugins-model-train').default;
let modelEvaluatePlugin = require('../packages/pipcook-plugins-model-evaluate').default;
let imageClassDataCollect = require('../packages/pipcook-plugins-image-class-data-collect').default

async function startPipeline() {
  // collect mnist data
  const dataCollect = DataCollect(imageClassDataCollect, {
    url: 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/eCommerceImageClassification.zip'
  });
  
  // access mnist data into our specifiction
  const dataAccess = DataAccess(imageClassDataAccess, {
    imgSize:[256, 256],
  });

  // load mobile net model
  const modelLoad = ModelLoad(mobileNetLoad, {
    modelName: 'test1'
  });

  // train the model
  const modelTrain = ModelTrain(modelTrainPlugin, {
    epochs: 15
  });

  // evaluate the model
  const modelEvaluate = ModelEvaluate(modelEvaluatePlugin);

  const runner = new PipcookRunner('test1', {
    predictServer: true
  });

  runner.run([dataCollect, dataAccess, modelLoad, modelTrain, modelEvaluate])
}

startPipeline();