import { PluginRT } from './';
import path from 'path';

const rt = new PluginRT({
  installDir: path.join(__dirname, './plugins/'),
  datasetDir: path.join(__dirname, './datasets/'),
  componentDir: path.join(__dirname, './components/')
});

(async function() {
  // const pkg1 = await rt.fetch('@pipcook/plugins-csv-data-collect');
  const pkg2 = await rt.fetch('../plugins/data-collect/csv-data-collect');
  // console.log(pkg1);
  console.log(pkg2);
  await rt.install(pkg2);

  // await rt.run('@pipcook/plugins-csv-data-collect', {
  //   url: 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textClassification.zip'
  // });
  // await rt.run('@pipcook/plugins-csv-data-access', {
  //   labelColumn: 'output'
  // });
  // await rt.run('@pipcook/plugins-bayesian-model-define');
  // await rt.run('@pipcook/plugins-bayesian-model-train');
})();
