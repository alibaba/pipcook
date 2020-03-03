const pipcook = require('@pipcook/pipcook-app').default;

const classifier = new pipcook.textClassification('bayes');

classifier.train('http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textDataBinding.csv', {}, false);