/**
 * This is an example Pipcook file. This pipeline is used to train the object detection task. We have several plugins used in this pipeline:
 * 
 * - imageDetectionDataCollect: used to collect the object detection data. This is a general-purpose object detection collect plugin.
 *   The user can specify the url of their own dataset instead of ours as long as the dataset conforms to the plugin's expectation. For more information
 *   of this plugin, Please refer to https://github.com/alibaba/pipcook/wiki/pipcook-plugins-image-detection-data-collect
 * 
 * - imageClassDataAccess: used to access the expected image dataset format (PASCOL VOC) and access these images into the pipeline. This is the uniform data
 *   access plugin for object detection and make sure that pipcook has uniform dataset that can be published and communicated later in data world. For more information
 *   about this plugin, Please refer to https://github.com/alibaba/pipcook/wiki/pipcook-plugins-image-detection-data-access
 * 
 * - imageDetectionModelLoad: used to a simple object detection model. For more information about this plguin ,Please refer to
 *   https://github.com/alibaba/pipcook/wiki/pipcook-plugins-image-detection-model-load
 * 
 * - modelTrainPlugin: uesd to train the model. Currently it supports models of tf.LayersModel. For more information, Please refer to 
 *   https://github.com/alibaba/pipcook/wiki/pipcook-plugins-model-train
 * 
 * - modelEvaluatePlugin: used to evaluate the model. Currently it supports models of tf.LayersModel and classification model which implements
 *   predict interface we defined for model. For more information, Please refer to https://github.com/alibaba/pipcook/wiki/pipcook-plugins-model-evaluate
 * 
 */
let {DataCollect, DataAccess, ModelLoad, ModelTrain, ModelEvaluate, PipcookRunner} = require('../packages/pipcook-core');

let imageClassModelTrain = require('../packages/pipcook-plugins-model-train').default;
let classModelEvalute = require('../packages/pipcook-plugins-model-evaluate').default;
let imageDetectionDataCollect = require('../packages/pipcook-plugins-image-detection-data-collect').default;
let imageDetectionModelLoad = require('../packages/pipcook-plugins-image-detection-model-load').default;
let imageDetectionDataAccess = require('../packages/pipcook-plugins-image-detection-data-access').default;

async function startPipeline() {
  // collect detection data
  const dataCollect = DataCollect(imageDetectionDataCollect, {
    url: 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/componentRecognition.zip',
    testSplit: 0.1
  });
  
  // access detection data into our specifiction
  const dataAccess = DataAccess(imageDetectionDataAccess);

  // load mobile net model
  const modelLoad = ModelLoad(imageDetectionModelLoad, {
    modelName: 'test1'
  });

  // train the model
  const modelTrain = ModelTrain(imageClassModelTrain, {
    epochs: 20,
    batchSize: 4
  });

  // evaluate the model
  const modelEvaluate = ModelEvaluate(classModelEvalute);

  const runner = new PipcookRunner('test1', {
    predictServer: true
  });

  runner.run([dataCollect, dataAccess, modelLoad, modelTrain, modelEvaluate])
  
}

startPipeline();