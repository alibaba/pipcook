
const options = process.argv;
const pipcook = require('@pipcook/pipcook-app').default;


const jobContent = JSON.parse(options[options.length - 1]);

if (jobContent.taskType === 'image-classification') {
  const classifier = new pipcook.imageClassification(jobContent.model, jobContent.metaData)
  
  classifier.train(jobContent.dataSource, jobContent.trainInfo, false);
}
