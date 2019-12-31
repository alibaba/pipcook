/**
 * This is an example Pipcook file. This pipeline is used to train the object detection task. We have several plugins used in this pipeline:
 * 
 * - imageCocoDataCollect: used to collect the object detection data which is at coco data format. 
 *   The user can specify the url of their own dataset instead of ours as long as the dataset conforms to the plugin's expectation. For more information
 *   of this plugin, Please refer to https://github.com/alibaba/pipcook/wiki/pipcook-plugins-image-coco-data-collect
 * 
 * - imageDetectronAccess: used to access the expected image dataset format (PASCOL VOC) and access these images into the pipeline. This is the uniform data
 *   access plugin for object detection and make sure that pipcook has uniform dataset that can be published and communicated later in data zoo. For more information
 *   about this plugin, Please refer to https://github.com/alibaba/pipcook/wiki/pipcook-plugins-detection-detectron-data-access
 * 
 * - detectronModelLoad: used to a load facebook detectron2 object detection model. For more information about this plguin ,Please refer to
 *   https://github.com/alibaba/pipcook/wiki/pipcook-plugins-detection-detectron-model-load
 * 
 * - detectronModelTrain: uesd to train the model. For more information, Please refer to 
 *   https://github.com/alibaba/pipcook/wiki/pipcook-plugins-detection-detectron-model-train
 * 
 * - detectronModelEvaluate: used to evaluate the detectron2 model.
 *   For more information, Please refer to https://github.com/alibaba/pipcook/wiki/pipcook-plugins-detection-detectron-model-evaluate
 * 
 */
const {DataCollect, DataAccess, ModelLoad, ModelTrain, ModelEvaluate, PipcookRunner} = require('@pipcook/pipcook-core');

const imageCocoDataCollect = require('@pipcook/pipcook-plugins-image-coco-data-collect').default;
const imageDetectronAccess = require('@pipcook/pipcook-plugins-detection-detectron-data-access').default;
const detectronModelLoad = require('@pipcook/pipcook-plugins-detection-detectron-model-load').default;
const detectronModelTrain = require('@pipcook/pipcook-plugins-detection-detectron-model-train').default;
const detectronModelEvaluate = require('@pipcook/pipcook-plugins-detection-detectron-model-evaluate').default;

async function startPipeline() {
   const dataCollect = DataCollect(imageCocoDataCollect, {
    url: 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/autoLayoutGroupRecognition.zip',
    testSplit: 0.1,
    annotationFileName: 'annotation.json'
  });
  
  const dataAccess = DataAccess(imageDetectronAccess);

  const modelLoad = ModelLoad(detectronModelLoad, {
    modelName: 'test1',
    device: 'cpu'
  });

  const modelTrain = ModelTrain(detectronModelTrain);

  const modelEvaluate = ModelEvaluate(detectronModelEvaluate);

  const runner = new PipcookRunner('test1', {
    predictServer: true
  });

  runner.run([dataCollect, dataAccess, modelLoad, modelTrain, modelEvaluate])

}

startPipeline();