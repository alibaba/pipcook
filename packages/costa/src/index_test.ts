import { PluginRT } from './runtime';
import path from 'path';

const rt = new PluginRT({
  installDir: path.join(__dirname, './plugins/'),
  datasetDir: path.join(__dirname, './datasets/'),
  componentDir: path.join(__dirname, './components/')
});

(async function() {
  const collectCsv = await rt.fetch('../plugins/data-collect/csv-data-collect');
  await rt.install(collectCsv);
  await rt.run(collectCsv, {
    url: 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textClassification.zip'
  });
  // await rt.run('@pipcook/plugins-csv-data-access', {
  //   labelColumn: 'output'
  // });
  // await rt.run('@pipcook/plugins-bayesian-model-define');
  // await rt.run('@pipcook/plugins-bayesian-model-train');
})();
