import path from 'path';
import { CostaRuntime } from '../src/runtime';
import { PluginPackage } from '../src';
import { stat, pathExists, readJson, createReadStream, remove } from 'fs-extra';
import { spawnSync } from 'child_process';

describe('create a costa runtime', () => {
  const costa = new CostaRuntime({
    installDir: path.join(__dirname, 'plugins'),
    datasetDir: path.join(__dirname, 'datasets'),
    componentDir: path.join(__dirname, 'components'),
    npmRegistryPrefix: 'https://registry.npmjs.com/'
  });
  let nodeSimple: PluginPackage;
  let pythonSimple: PluginPackage;
  let npmPkg: PluginPackage;
  let collectCsvWithSpecificVer: PluginPackage;
  const nodeSimplePath = path.join(__dirname, '../../tests/plugins/nodejs-simple');
  const pythonSimplePath = path.join(__dirname, '../../tests/plugins/python-simple');

  it('should fetch a plugin and install from local', async () => {
    nodeSimple = await costa.fetch(nodeSimplePath);
    expect(nodeSimple.name).toBe('nodejs-simple');
    expect(nodeSimple.pipcook.datatype).toBe('text');
    expect(nodeSimple.pipcook.category).toBe('modelDefine');
    await costa.install(nodeSimple, process);
    await stat(path.join(
      costa.options.installDir,
      'node_modules',
      nodeSimple.name
    ));
  });

  it('should uninstall the package', async () => {
    await costa.uninstall({ name: nodeSimple.name, version: nodeSimple.version });
    expect(!await pathExists(path.join(
      costa.options.installDir,
      'node_modules',
      nodeSimple.name
    )));
    expect(!await pathExists(path.join(
      costa.options.installDir,
      'conda_envs',
      `${nodeSimple.name}@${nodeSimple.version}`
    )));
    const pkg = await readJson(path.join(costa.options.installDir, 'package.json'));
    expect(!pkg.dependencies || !pkg.dependencies[nodeSimple.name]);
  });

  it('should fetch a python plugin and install from local', async () => {
    pythonSimple = await costa.fetch(pythonSimplePath);
    expect(pythonSimple.name).toBe('python-simple');
    expect(pythonSimple.pipcook.category).toBe('modelDefine');
    await costa.install(pythonSimple, process);
    // make sure js packages are installed.
    await stat(path.join(costa.options.installDir, 'node_modules', pythonSimple.name));
    // make sure python packages are installed.
    await stat(path.join(costa.options.installDir, 'conda_envs', `${pythonSimple.name}@${pythonSimple.version}`));
    // make sure python caches are used.
    await stat(path.join(costa.options.installDir, '.pip/selfcheck.json'));
  });

  it('should fetch a plugin and install from npm', async () => {
    npmPkg = await costa.fetch('@pipcook/plugins-csv-data-collect');
    expect(npmPkg.name).toBe('@pipcook/plugins-csv-data-collect');
    expect(npmPkg.pipcook.category).toBe('dataCollect');
    await costa.install(npmPkg, process);
    // make sure js packages are installed.
    await stat(path.join(costa.options.installDir, 'node_modules', npmPkg.name));
    // make sure python caches are used.
    await stat(path.join(costa.options.installDir, '.pip/selfcheck.json'));
  });

  it('should fetch a plugin and install from tarball', async () => {
    collectCsvWithSpecificVer = await costa.fetch('https://registry.npmjs.org/@pipcook/plugins-csv-data-collect/-/plugins-csv-data-collect-1.0.0.tgz');
    expect(collectCsvWithSpecificVer.name).toBe('@pipcook/plugins-csv-data-collect');
    expect(collectCsvWithSpecificVer.version).toBe('1.0.0');
    await costa.install(collectCsvWithSpecificVer, process);
    await stat(path.join(
      costa.options.installDir,
      'node_modules',
      collectCsvWithSpecificVer.name
    ));
  });

  it('should fetch a plugin from npm', async () => {
    collectCsvWithSpecificVer = await costa.fetch('@pipcook/plugins-csv-data-collect@0.5.8');
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

  it('should fetch a plugin from tarball readstream', async () => {
    let packName = spawnSync('npm', [ 'pack' ], { cwd: nodeSimplePath }).stdout.toString();
    packName = packName.replace(/\r|\n/g, '');
    const packageStream = createReadStream(path.join(nodeSimplePath, packName));
    nodeSimple = await costa.fetchByStream(packageStream);
    expect(nodeSimple.name).toBe('nodejs-simple');
    await costa.install(nodeSimple, process);
    await stat(path.join(
      costa.options.installDir,
      'node_modules',
      nodeSimple.name
    ));
    remove(path.join(nodeSimplePath, packName));
  });

  it('should start the package', async () => {
    const runnable = await costa.createRunnable({ id: 'foobar' });
    await runnable.start(nodeSimple, {
      dataDir: costa.options.datasetDir,
      url: 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textClassification.zip'
    });
    await runnable.destroy();
  });

  it('should uninstall all the packages', async () => {
    await costa.uninstall([
      nodeSimple,
      pythonSimple,
      npmPkg,
      collectCsvWithSpecificVer
    ]);
    const nodeDirCheck = async (name: string) => {
      expect(!await pathExists(path.join(
        costa.options.installDir,
        'node_modules',
        name
      )));
    };
    const condaDirCheck = async (name: string, version: string) => {
      expect(!await pathExists(path.join(
        costa.options.installDir,
        'conda_envs',
        `${name}@${version}`
      )));
    };
    await nodeDirCheck(nodeSimple.name);
    await nodeDirCheck(pythonSimple.name);
    await nodeDirCheck(collectCsvWithSpecificVer.name);
    await condaDirCheck(nodeSimple.name, nodeSimple.version);
    await condaDirCheck(pythonSimple.name, pythonSimple.version);
    await condaDirCheck(collectCsvWithSpecificVer.name, collectCsvWithSpecificVer.version);
    const pkg = await readJson(path.join(costa.options.installDir, 'package.json'));
    expect(!pkg.dependencies
      || !pkg.dependencies[nodeSimple.name]
      || !pkg.dependencies[pythonSimple.name]
      || !pkg.dependencies[collectCsvWithSpecificVer.name]
    );
  });

});
