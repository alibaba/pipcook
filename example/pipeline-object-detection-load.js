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
let {DataAccess, ModelLoad, PipcookRunner, ModelDeploy, ModelTrain, ModelEvaluate, DataCollect} = require('../packages/pipcook-core');

let imageDetectronAccess = require('../packages/pipcook-plugins-detection-detectron-data-access').default;
let detectronModelLoad = require('../packages/pipcook-plugins-detection-detectron-model-load').default;
let detectronModelDeploy = require('../packages/pipcook-plugins-detection-detectron-model-deploy').default;
let imageCocoDataCollect = require('../packages/pipcook-plugins-image-coco-data-collect').default;

let detectronModelTrain = require('../packages/pipcook-plugins-detection-detectron-model-train').default;
let detectronModelEvaluate = require('../packages/pipcook-plugins-detection-detectron-model-evaluate').default;

async function startPipeline() {
  const dataCollect = DataCollect(imageCocoDataCollect, {
    url: 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/autoLayoutGroupRecognition.zip',
    annotationFileName: 'annotation.json'
  }); 

  // access detection data into our specifiction
  const dataAccess = DataAccess(imageDetectronAccess);

  // load mobile net model
  const modelLoad = ModelLoad(detectronModelLoad, {
    modelName: 'test1',
    device: 'cpu',
    maxIter: 1,
  });

  const modelTrain = ModelTrain(detectronModelTrain);

  const modelEvaluate = ModelEvaluate(detectronModelEvaluate);

  const modelDeploy = ModelDeploy(detectronModelDeploy);

  const runner = new PipcookRunner('test1', {
    predictServer: true
  });

  runner.run([dataCollect, dataAccess, modelLoad, modelTrain, modelEvaluate, modelDeploy])

}

startPipeline();