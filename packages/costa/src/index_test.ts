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

  // await rt.install(collectCsv);
  // await rt.install(accessCsvDataset);

  const r = await costa.createRunnable();
  const dataDir = costa.config.datasetDir + `/${collectCsv.name}@${collectCsv.version}`;

  await r.start(collectCsv, {
    url: 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textClassification.zip',
    dataDir
  });
  await r.start(accessCsvDataset, {
    labelColumn: 'output',
    dataDir
  });

  // await rt.run('@pipcook/plugins-csv-data-access', {
  //   labelColumn: 'output'
  // });
  // await rt.run('@pipcook/plugins-bayesian-model-define');
  // await rt.run('@pipcook/plugins-bayesian-model-train');
})();
