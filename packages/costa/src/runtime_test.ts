import path from 'path';
import { CostaRuntime } from './runtime';
import { PluginPackage } from '.';
import { stat } from 'fs-extra';

describe('create a costa runtime', () => {
  const costa = new CostaRuntime({
    installDir: path.join(__dirname, '../.tests/plugins'),
    datasetDir: path.join(__dirname, '../.tests/datasets'),
    componentDir: path.join(__dirname, '../.tests/components')
  });
  let collectCsv: PluginPackage;

  it('should fetch a plugin and install', async () => {
    collectCsv = await costa.fetch('../plugins/data-collect/csv-data-collect');
    expect(collectCsv.name).toBe('@pipcook/plugins-csv-data-collect');
    expect(collectCsv.pipcook.datatype).toBe('text');
    expect(collectCsv.pipcook.category).toBe('dataCollect');
  });

  it('should install the package', async () => {
    await costa.install(collectCsv);
    await stat(path.join(
      costa.options.installDir,
      'node_modules',
      collectCsv.name
    ));
    await stat(path.join(
      costa.options.installDir,
      'conda_envs',
      `${collectCsv.name}@${collectCsv.version}`
    ));
  }, 30 * 1000);

  it('should start the package', async () => {
    const runnable = await costa.createRunnable();
    await runnable.start(collectCsv, {
      dataDir: costa.options.datasetDir
    });
    await runnable.destroy();
  });
});
