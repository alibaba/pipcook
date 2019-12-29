/**
 * This is an example Pipcook file. This pipeline is used to load an previous trained model and only run for prediction (deployment)
 * 
 * - imageClassDataAccess: used to access the expected image dataset format (PASCOL VOC) and access these images into the pipeline. This is the uniform data
 *   access plugin for image and make sure that pipcook has uniform dataset that can be published and communicated later in data world. For more information
 *   about this plugin, Please refer to https://github.com/alibaba/pipcook/wiki/pipcook-plugins-image-class-data-access
 * 
 * - simpleCnnModelLoad: used to load the a 5-conv CNN network specifically. For more information about this plguin ,Please refer to
 *   https://github.com/alibaba/pipcook/wiki/pipcook-plugins-simple-cnn-model-load
 * 
 */
let {DataAccess, ModelLoad, PipcookRunner} = require('../packages/pipcook-core');

let imageClassDataAccess = require('../packages/pipcook-plugins-image-class-data-access').default;
let simpleCnnModelLoad = require('../packages/pipcook-plugins-simple-cnn-model-load').default;


async function startPipeline() {
  // access mnist data into our specifiction
  const dataAccess = DataAccess(imageClassDataAccess, {
    imgSize:[28, 28],
  });

  // load mobile net model
  const modelLoad = ModelLoad(simpleCnnModelLoad, {
    modelName: 'test1',
    modelId: '<your own id>'
  });

  const runner = new PipcookRunner('test1', {
    onlyPredict: true
  });

  runner.run([dataAccess, modelLoad])
}

startPipeline();


