import path from 'path';
import { CostaRuntime } from '../src/runtime';
import { PluginRunnable } from '../src/runnable';
import { readdir, readFile } from 'fs-extra';

const INSTALL_SPECS_TIMEOUT = 180 * 1000;

describe('start runnable in normal way', () => {
  const opts = {
    installDir: path.join(__dirname, '../.tests/plugins'),
    datasetDir: path.join(__dirname, '../.tests/datasets'),
    componentDir: path.join(__dirname, '../.tests/components'),
    npmRegistryPrefix: 'https://registry.npmjs.com/'
  };
  const costa = new CostaRuntime(opts);
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

  let tmp: any;
  it('should start a nodejs plugin', async () => {
    const simple = await costa.fetch('./plugins/nodejs-simple', path.join(__dirname, '../../test'));
    await costa.install(simple, process);
    tmp = await runnable.start(simple, { foobar: true });
    const stdout = await readFile(path.join(opts.componentDir, runnable.id, 'logs/stdout.log'), 'utf8');
    expect(stdout.search('{ foobar: true }') !== 0).toBe(true);
  }, INSTALL_SPECS_TIMEOUT);

  it('should start a python plugin', async () => {
    const simple = await costa.fetch('./plugins/python-simple', path.join(__dirname, '../../test'));
    await costa.install(simple, process);
    expect(simple.pipcook.runtime).toBe('python');

    // test passing the variable from js to python.
    const tmp2 = await runnable.start(simple, tmp);
    const stdout = await readFile(path.join(opts.componentDir, runnable.id, 'logs/stdout.log'), 'utf8');
    expect(stdout.search('hello python!') !== 0).toBe(true);
    expect(stdout.search('fn1([0. 0.])') !== 0).toBe(true);
    expect(stdout.search('fn2()') !== 0).toBe(true);

    // test passing the variable from python to python.
    await runnable.start(simple, tmp2);
    const stdout2 = await readFile(path.join(opts.componentDir, runnable.id, 'logs/stdout.log'), 'utf8');
    expect(stdout2.search('hello python! [0. 0. 0. 0. 0. 0. 0. 0. 0. 0.]') !== 0).toBe(true);
  }, INSTALL_SPECS_TIMEOUT);

  it('should destroy the runnable', async () => {
    await runnable.destroy();
    const list = await readdir(costa.options.componentDir);
    expect(list.length).toBe(1);
  });
});
