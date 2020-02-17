const pipcook = require('@pipcook/pipcook-app').default;

const classifier = new pipcook.objectDetection('faster-rcnn', {
  device: 'cpu',
  maxIter: 100000,
});

classifier.train('http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/autoLayoutGroupRecognition.zip', {
  testSplit: 0.01
});