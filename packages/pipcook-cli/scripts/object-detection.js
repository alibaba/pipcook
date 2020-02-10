
const options = process.argv;
const pipcook = require('@pipcook/pipcook-app').default;


const jobContent = JSON.parse(options[options.length - 1]);

if (jobContent.taskType === 'object-detection') {
  const classifier = new pipcook.objectDetection(jobContent.model, jobContent.metaData);
  
  if (jobContent.easConfig) {
    classifier.trainAndEasDeploy(jobContent.dataSource, jobContent.trainInfo, jobContent.easConfig, false);
  } else {
    classifier.train(jobContent.dataSource, jobContent.trainInfo, false);
  }
}
