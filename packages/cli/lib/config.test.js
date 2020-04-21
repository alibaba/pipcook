const path = require('path');

module.exports = {
  dependencies: [
    path.join(__dirname, "../../../packages/boa"),
    path.join(__dirname, "../../../packages/core"),
    path.join(__dirname, "../../../packages/plugins/data-access/coco-data-access"),
    path.join(__dirname, "../../../packages/plugins/data-access/csv-data-access"),
    path.join(__dirname, "../../../packages/plugins/data-collect/image-classification-data-collect"),
    path.join(__dirname, "../../../packages/plugins/data-collect/mnist-data-collect"),
    path.join(__dirname, "../../../packages/plugins/data-process/image-data-process"),
    path.join(__dirname, "../../../packages/plugins/model-define/bayesian-model-define"),
    path.join(__dirname, "../../../packages/plugins/model-train/bayesian-model-train"),
  ],
  pipcookLogName: 'pipcook-output',
  optionalNpmClients: [ 'npm', 'cnpm', 'tnpm' ]
};
