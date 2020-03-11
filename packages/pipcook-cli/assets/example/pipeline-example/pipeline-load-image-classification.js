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
const {DataAccess, ModelLoad, PipcookRunner, ModelDeploy} = require('@pipcook/pipcook-core');

const imageClassDataAccess = require('@pipcook/pipcook-plugins-image-class-data-access').default;
const simpleCnnModelLoad = require('@pipcook/pipcook-plugins-simple-cnn-model-load').default;
const imageClassLocalModelDeploy = require('@pipcook/pipcook-plugins-image-class-local-model-deploy').default;

async function startPipeline() {
  // access mnist data into our specifiction
  const dataAccess = DataAccess(imageClassDataAccess, {
    imgSize:[28, 28],
  });

  // load mobile net model
  const modelLoad = ModelLoad(simpleCnnModelLoad, {
    modelId: '<model id>'
  });

  // deploy to local
  const modelDeploy = ModelDeploy(imageClassLocalModelDeploy);

  const runner = new PipcookRunner();

  runner.run([dataAccess, modelLoad, modelDeploy])
}

startPipeline();


