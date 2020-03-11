export function choosePipeline(data, that) {
  switch(data) {
    case 'image-classification':
      that.setState({
        pluginMap: {
          'data-collect': {
            name: '@pipcook/pipcook-plugins-image-class-data-collect',
            params: {
              url: 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/eCommerceImageClassification.zip',
            },
          },
          'data-access': {
            name: '@pipcook/pipcook-plugins-image-class-data-access',
            params: {
              imgSize:[256, 256],
            },
          },
          'model-load': {
            name: '@pipcook/pipcook-plugins-local-mobilenet-model-load',
            params: {
              isFreeze: false,
            },
          },
          'model-train': {
            name: '@pipcook/pipcook-plugins-model-train',
            params: {
              epochs: 15,
              batchSize: 16,
            },
          },
          'model-evaluate': {
            name: '@pipcook/pipcook-plugins-model-evaluate',
          },
        },
      });
      break;

    case 'object-detection':
      that.setState({
        pluginMap: {
          'data-collect': {
            name: '@pipcook/pipcook-plugins-image-coco-data-collect',
            params: {
              url: 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/autoLayoutGroupRecognition.zip',
              testSplit: 0.1,
              annotationFileName: 'annotation.json',
            },
          },
          'data-access': {
            name: '@pipcook/pipcook-plugins-detection-detectron-data-access',
          },
          'model-load': {
            name: '@pipcook/pipcook-plugins-detection-detectron-model-load',
            params: {
              device: 'cpu',
            },
          },
          'model-train': {
            name: '@pipcook/pipcook-plugins-detection-detectron-model-train',
          },
          'model-evaluate': {
            name: '@pipcook/pipcook-plugins-detection-detectron-model-evaluate',
          },
        },
      });
      break;
    case 'text-classification':
      that.setState({
        pluginMap: {
          'data-collect': {
            name: '@pipcook/pipcook-plugins-text-class-data-collect',
            params: {
              url: 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textDataBinding.csv',
              validationSplit:0.1,
              testSplit:0.1,
            },
          },
          'data-access': {
            name: '@pipcook/pipcook-plugins-text-csv-data-access',
          },
          'model-load': {
            name: '@pipcook/pipcook-plugins-bayesian-classifier-model-load',
          },
          'model-train': {
            name: '@pipcook/pipcook-plugins-bayesian-classifier-model-train',
          },
          'model-evaluate': {
            name: '@pipcook/pipcook-plugins-bayesian-classifier-model-evaluate',
          },
        },
      });
      break;
    default:
      break;
  }
}