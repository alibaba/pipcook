module.exports = {
  dependencies: [
    '@pipcook/pipcook-core',
    '@pipcook/pipcook-plugins-bayesian-classifier-model-load',
    '@pipcook/pipcook-plugins-bayesian-classifier-model-train',
    '@pipcook/pipcook-plugins-model-evaluate',
    '@pipcook/pipcook-plugins-image-class-data-access',
    '@pipcook/pipcook-plugins-image-class-data-process',
    '@pipcook/pipcook-plugins-image-mnist-data-collect',
    '@pipcook/pipcook-plugins-local-mobilenet-model-load',
    '@pipcook/pipcook-plugins-model-train',
    '@pipcook/pipcook-plugins-text-csv-data-access',
    '@pipcook/pipcook-plugins-odps-data-collect',
    '@pipcook/pipcook-plugins-simple-cnn-model-load',
    '@pipcook/pipcook-plugins-image-class-data-collect',
    '@pipcook/pipcook-python-node',
    '@pipcook/pipcook-plugins-text-class-data-collect',
    '@pipcook/pipcook-plugins-detection-detectron-model-evaluate',
    '@pipcook/pipcook-plugins-detection-detectron-model-load',
    '@pipcook/pipcook-plugins-detection-detectron-model-train',
    '@pipcook/pipcook-plugins-detection-detectron-data-access',
    '@pipcook/pipcook-plugins-image-coco-data-collect',
    '@pipcook/pipcook-plugins-detection-detectron-model-deploy',
    '@pipcook/pipcook-plugins-image-class-local-model-deploy',
    '@pipcook/pipcook-plugins-text-class-local-model-deploy',
    '@pipcook/pipcook-plugins-detection-detectron-eas-model-deploy',
    "@pipcook/pipcook-plugins-image-class-eas-deploy",
    '@pipcook/pipcook-app',
    "@pipcook/pipcook-plugins-bayesian-classifier-model-eas-deploy",
    "@pipcook/pipcook-plugins-bayesian-classifier-model-evaluate"

  ],
  pipcookLogName: 'pipcook-output'
}