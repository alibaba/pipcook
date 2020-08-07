import path from 'path';
import { CostaRuntime } from './runtime';
import { PluginPackage } from '.';
import { stat } from 'fs-extra';

const INSTALL_SPECS_TIMEOUT = 180 * 1000;

describe('create a costa runtime', () => {
  const costa = new CostaRuntime({
    installDir: path.join(__dirname, '../.tests/plugins'),
    datasetDir: path.join(__dirname, '../.tests/datasets'),
    componentDir: path.join(__dirname, '../.tests/components'),
    npmRegistryPrefix: 'https://registry.npmjs.com/'
  });
  let collectCsv: PluginPackage;

  it('should fetch a plugin and install from local', async () => {
    collectCsv = await costa.fetch('../plugins/data-collect/csv-data-collect');
    expect(collectCsv.name).toBe('@pipcook/plugins-csv-data-collect');
    expect(collectCsv.pipcook.datatype).toBe('text');
    expect(collectCsv.pipcook.category).toBe('dataCollect');
    await costa.install(collectCsv, process);
    await stat(path.join(
      costa.options.installDir,
      'node_modules',
      collectCsv.name
    ));
  }, INSTALL_SPECS_TIMEOUT);

  it('should fetch a python plugin and install from local', async () => {
    const bayesClassifier = await costa.fetch('../plugins/model-define/bayesian-model-define');
    expect(bayesClassifier.name).toBe('@pipcook/plugins-bayesian-model-define');
    expect(bayesClassifier.pipcook.category).toBe('modelDefine');
    await costa.install(bayesClassifier, process);
    // make sure js packages are installed.
    await stat(path.join(costa.options.installDir, 'node_modules', bayesClassifier.name));
    // make sure python packages are installed.
    await stat(path.join(costa.options.installDir, 'conda_envs', `${bayesClassifier.name}@${bayesClassifier.version}`));
    // make sure python caches are used.
    await stat(path.join(costa.options.installDir, '.pip/selfcheck.json'));
  }, INSTALL_SPECS_TIMEOUT);

  it('should fetch a plugin and install from tarball', async () => {
    const collectCsvWithSpecificVer = await costa.fetch('https://registry.npmjs.org/@pipcook/plugins-csv-data-collect/-/plugins-csv-data-collect-0.5.8.tgz');
    expect(collectCsvWithSpecificVer.name).toBe('@pipcook/plugins-csv-data-collect');
    expect(collectCsvWithSpecificVer.version).toBe('0.5.8');
    await costa.install(collectCsvWithSpecificVer, process);
    await stat(path.join(
      costa.options.installDir,
      'node_modules',
      collectCsvWithSpecificVer.name
    ));
  }, INSTALL_SPECS_TIMEOUT);

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

  it('should install the package without conda packages', async () => {
    await costa.install(collectCsv, process);
    await stat(path.join(
      costa.options.installDir,
      'node_modules',
      collectCsv.name
    ));
  }, INSTALL_SPECS_TIMEOUT);

  it('should start the package', async () => {
    const runnable = await costa.createRunnable({ id: 'foobar' });
    await runnable.start(collectCsv, {
      dataDir: costa.options.datasetDir,
      url: 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textClassification.zip'
    });
    await runnable.destroy();
  }, INSTALL_SPECS_TIMEOUT);
});
