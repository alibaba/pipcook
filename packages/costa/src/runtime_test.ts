import path from 'path';
import { CostaRuntime } from './runtime';
import { PluginPackage } from '.';
import { stat } from 'fs-extra';

console.log(process.env.NODE_ENV);
describe('create a costa runtime', () => {
  const costa = new CostaRuntime({
    installDir: path.join(__dirname, '../.tests/plugins'),
    datasetDir: path.join(__dirname, '../.tests/datasets'),
    componentDir: path.join(__dirname, '../.tests/components'),
    npmRegistryPrefix: 'https://registry.npmjs.com/'
  });
  let collectCsv: PluginPackage;

  it('should fetch a plugin and install', async () => {
    collectCsv = await costa.fetch('../plugins/data-collect/csv-data-collect');
    expect(collectCsv.name).toBe('@pipcook/plugins-csv-data-collect');
    expect(collectCsv.pipcook.datatype).toBe('text');
    expect(collectCsv.pipcook.category).toBe('dataCollect');
  });

  it('should fetch a plugin from npm', async () => {
    const collectCsvWithSpecificVer = await costa.fetch('@pipcook/plugins-csv-data-collect@0.5.8');
    expect(collectCsvWithSpecificVer.name).toBe('@pipcook/plugins-csv-data-collect');
    expect(collectCsvWithSpecificVer.version).toBe('0.5.8');

    const collectCsvLatest = await costa.fetch('@pipcook/plugins-csv-data-collect@latest');
    expect(collectCsvLatest.name).toBe('@pipcook/plugins-csv-data-collect');

    const collectCsvOnBeta = await costa.fetch('@pipcook/plugins-csv-data-collect@beta');
    expect(collectCsvOnBeta.name).toBe('@pipcook/plugins-csv-data-collect');
    expect(collectCsvOnBeta.version.search('beta') !== -1).toBe(true);

    const collectCsvOnBare = await costa.fetch('@pipcook/plugins-csv-data-collect');
    expect(collectCsvOnBare.name).toBe('@pipcook/plugins-csv-data-collect');
    expect(collectCsvOnBare.version).toBe(collectCsvLatest.version);
  }, 30 * 1000);

  it('should fetch a plugin from tarball', async () => {
    const collectCsvWithSpecificVer = await costa.fetch('https://registry.npmjs.org/@pipcook/plugins-csv-data-collect/-/plugins-csv-data-collect-0.5.8.tgz');
    expect(collectCsvWithSpecificVer.name).toBe('@pipcook/plugins-csv-data-collect');
    expect(collectCsvWithSpecificVer.version).toBe('0.5.8');
  }, 30 * 1000);

  it('should install the package without conda packages', async () => {
    await costa.install(collectCsv);
    await stat(path.join(
      costa.options.installDir,
      'node_modules',
      collectCsv.name
    ));
  }, 180 * 1000);

  it('should install the package with conda packages', async () => {
    const bayesClassifier = await costa.fetch('../plugins/model-define/bayesian-model-define');
    await costa.install(bayesClassifier);
    await stat(path.join(
      costa.options.installDir,
      'node_modules',
      bayesClassifier.name
    ));
    await stat(path.join(
      costa.options.installDir,
      'conda_envs',
      `${bayesClassifier.name}@${bayesClassifier.version}`
    ));
  }, 180 * 1000);

  it('should start the package', async () => {
    const runnable = await costa.createRunnable({ id: 'foobar' });
    await runnable.start(collectCsv, {
      dataDir: costa.options.datasetDir,
      url: 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textClassification.zip'
    });
    await runnable.destroy();
  }, 180 * 1000);
});
