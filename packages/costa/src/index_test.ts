import path from 'path';
import { PluginRT } from './runtime';

const costa = new PluginRT({
  installDir: path.join(__dirname, './plugins/'),
  datasetDir: path.join(__dirname, './datasets/'),
  componentDir: path.join(__dirname, './components/')
});

(async function() {
  const collectCsv = await costa.fetch('../plugins/data-collect/csv-data-collect');
  const accessCsvDataset = await costa.fetch('../plugins/data-access/csv-data-access');
  const defineBayesianClassfier = await costa.fetch('../plugins/model-define/bayesian-model-define');
  const trainClassfier = await costa.fetch('../plugins/model-train/bayesian-model-train');
  const evaluateClassfier = await costa.fetch('../plugins/model-evaluate/bayesian-model-evaluate');

  await costa.install(collectCsv);
  await costa.install(accessCsvDataset);
  await costa.install(defineBayesianClassfier);
  await costa.install(trainClassfier);
  await costa.install(evaluateClassfier);

  const r = await costa.createRunnable();
  const dataDir = costa.config.datasetDir + `/${collectCsv.name}@${collectCsv.version}`;

  // collect dataset
  await r.start(collectCsv, {
    url: 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textClassification.zip',
    dataDir
  });
  // create dataset
  const dataset = await r.start(accessCsvDataset, {
    labelColumn: 'output',
    dataDir
  });
  // define the model
  let model = await r.start(defineBayesianClassfier, dataset, {});
  // train the model
  model = await r.start(trainClassfier, dataset, model, {
    modelPath: r.workingDir
  });
  // evalute the model and get result
  const result = await r.start(evaluateClassfier, dataset, model, {
    modelDir: r.workingDir
  });
  console.log(await r.valueOf(result));
})();
