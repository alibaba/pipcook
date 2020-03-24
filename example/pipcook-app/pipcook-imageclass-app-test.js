const pipcook = require('@pipcook/pipcook-app').default;

const classifier = new pipcook.imageClassification('mobilenet', {
  imageSize: [256, 256]
});

classifier.train('http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/eCommerceImageClassification.zip', {
  epochs: 15,
}, false);
