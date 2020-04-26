export const dependencies: string[] = [
  '@pipcook/boa',
  '@pipcook/pipcook-core',
  '@pipcook/plugins-coco-data-access',
  '@pipcook/plugins-csv-data-access',
  '@pipcook/plugins-pascalvoc-data-access',
  '@pipcook/plugins-csv-data-collect',
  '@pipcook/plugins-image-classification-data-collect',
  '@pipcook/plugins-mnist-data-collect',
  '@pipcook/plugins-object-detection-coco-data-collect',
  '@pipcook/plugins-object-detection-pascalvoc-data-collect',
  '@pipcook/plugins-image-data-process',
  '@pipcook/plugins-bayesian-model-evaluate',
  '@pipcook/plugins-image-classification-tfjs-model-evaluate',
  '@pipcook/plugins-object-detection-detectron-model-evaluate',
  '@pipcook/plugins-bayesian-model-define',
  '@pipcook/plugins-detectron-fasterrcnn-model-define',
  '@pipcook/plugins-tfjs-mobilenet-model-define',
  '@pipcook/plugins-tfjs-simplecnn-model-define',
  '@pipcook/plugins-bayesian-model-train',
  '@pipcook/plugins-image-classification-tfjs-model-train',
  '@pipcook/plugins-object-detection-detectron-model-train'
];

export const pipcookLogName: string = 'pipcook-output';
export const optionalNpmClients: string[] = [ 'npm', 'cnpm', 'tnpm' ];
