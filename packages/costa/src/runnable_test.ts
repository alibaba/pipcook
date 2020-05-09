import path from 'path';
import { CostaRuntime } from './runtime';
import { PluginRunnable } from './runnable';
import { readdir } from 'fs-extra';

describe('start runnable in normal way', () => {
  const costa = new CostaRuntime({
    installDir: path.join(__dirname, '../.tests/plugins'),
    datasetDir: path.join(__dirname, '../.tests/datasets'),
    componentDir: path.join(__dirname, '../.tests/components')
  });
  let runnable: PluginRunnable;

  it('should create a new runnable', () => {
    runnable = new PluginRunnable(costa);
    expect(runnable.workingDir).toBeInstanceOf(String);
    expect(runnable.state).toBe('init');
  });

  it('should bootstrap the runnable', async () => {
    await runnable.bootstrap({});
    expect(runnable.state).toBe('idle');
  });

  it('should destroy the runnable', async () => {
    await runnable.destroy();
    const list = await readdir(costa.options.componentDir);
    expect(list.length).toBe(0);
  });
});
