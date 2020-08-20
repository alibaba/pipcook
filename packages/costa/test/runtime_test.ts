import path from 'path';
import { CostaRuntime } from '../src/runtime';
import { PluginPackage } from '../src';
import { stat } from 'fs-extra';
import { spawnSync } from 'child_process';
import { createReadStream } from 'fs-extra';

describe('create a costa runtime', () => {
  const costa = new CostaRuntime({
    installDir: path.join(__dirname, '../.tests/plugins'),
    datasetDir: path.join(__dirname, '../.tests/datasets'),
    componentDir: path.join(__dirname, '../.tests/components'),
    npmRegistryPrefix: 'https://registry.npmjs.com/'
  });
  let collectCsv: PluginPackage;

  it('should fetch a plugin and install from local', async () => {
    collectCsv = await costa.fetch(path.join(process.cwd(), '../plugins/data-collect/csv-data-collect'));
    expect(collectCsv.name).toBe('@pipcook/plugins-csv-data-collect');
    expect(collectCsv.pipcook.datatype).toBe('text');
    expect(collectCsv.pipcook.category).toBe('dataCollect');
    await costa.install(collectCsv, process);
    await stat(path.join(
      costa.options.installDir,
      'node_modules',
      collectCsv.name
    ));
  });

  it('should fetch a python plugin and install from local', async () => {
    const bayesClassifier = await costa.fetch(path.join(process.cwd(), '../plugins/model-define/bayesian-model-define'));
    expect(bayesClassifier.name).toBe('@pipcook/plugins-bayesian-model-define');
    expect(bayesClassifier.pipcook.category).toBe('modelDefine');
    await costa.install(bayesClassifier, process);
    // make sure js packages are installed.
    await stat(path.join(costa.options.installDir, 'node_modules', bayesClassifier.name));
    // make sure python packages are installed.
    await stat(path.join(costa.options.installDir, 'conda_envs', `${bayesClassifier.name}@${bayesClassifier.version}`));
    // make sure python caches are used.
    await stat(path.join(costa.options.installDir, '.pip/selfcheck.json'));
  });

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
  });

  it('should install the package without conda packages', async () => {
    await costa.install(collectCsv, process);
    await stat(path.join(
      costa.options.installDir,
      'node_modules',
      collectCsv.name
    ));
  });

  it('should install the package with conda packages', async () => {
    const bayesClassifier = await costa.fetch(path.join(process.cwd(), '../plugins/model-define/bayesian-model-define'));
    await costa.install(bayesClassifier, process);
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
  });
  it('should fetch a plugin from tarball readstream', async () => {
    const pathname = path.join(__dirname, '../../plugins/data-collect/chinese-poem-data-collect');
    let packName = spawnSync('npm', [ 'pack' ], { cwd: pathname }).stdout.toString();
    console.log('packname', packName);
    packName = packName.replace(/\r|\n/g, '');
    const packageStream = createReadStream(path.join(pathname, packName));
    const collectCsvWithSpecificVer = await costa.fetchByStream(packageStream);
    expect(collectCsvWithSpecificVer.name).toBe('@pipcook/plugins-chinese-poem-data-collect');
    await costa.install(collectCsvWithSpecificVer, process);
    await stat(path.join(
      costa.options.installDir,
      'node_modules',
      collectCsvWithSpecificVer.name
    ));
  });

  it('should start the package', async () => {
    const runnable = await costa.createRunnable({ id: 'foobar' });
    await runnable.start(collectCsv, {
      dataDir: costa.options.datasetDir,
      url: 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textClassification.zip'
    });
    await runnable.destroy();
  });
});
