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
  const trainBayesianClassfier = await costa.fetch('../plugins/model-train/bayesian-model-train');

  await costa.install(collectCsv);
  await costa.install(accessCsvDataset);
  await costa.install(defineBayesianClassfier);
  await costa.install(trainBayesianClassfier);

  const r = await costa.createRunnable();
  const dataDir = costa.config.datasetDir + `/${collectCsv.name}@${collectCsv.version}`;

  await r.start(collectCsv, {
    url: 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textClassification.zip',
    dataDir
  });
  const dataset = await r.start(accessCsvDataset, {
    labelColumn: 'output',
    dataDir
  });
  let model = await r.start(defineBayesianClassfier, dataset, {});
  model = await r.start(trainBayesianClassfier, dataset, model, {
    modelPath: r.workingDir
  });

  // await rt.run('@pipcook/plugins-bayesian-model-define');
  // await rt.run('@pipcook/plugins-bayesian-model-train');
})();
