import * as path from 'path';
import { pathExists, readdir, readFile, symlink, mkdirp, remove } from 'fs-extra';
import { Writable } from 'stream';
import { CostaRuntime } from '../src/runtime';
import { PluginRunnable } from '../src/runnable';

const INSTALL_SPECS_TIMEOUT = 180 * 1000;
class StringWritable extends Writable {
  data = '';
  constructor() {
    super();
  }

  _write(chunk: any): void {
    this.data += chunk;
  }
}

describe('start runnable in normal way', () => {
  const opts = {
    installDir: path.join(__dirname, '../.tests/plugins'),
    datasetDir: path.join(__dirname, '../.tests/datasets'),
    componentDir: path.join(__dirname, '../.tests/components'),
    npmRegistryPrefix: 'https://registry.npmjs.com/'
  };
  const costa = new CostaRuntime(opts);
  let runnable: PluginRunnable;
  it('perpare', async () => {
    await Promise.all([
      remove(opts.installDir),
      remove(opts.datasetDir),
      remove(opts.componentDir)
    ]);
    await Promise.all([
      mkdirp(opts.installDir),
      mkdirp(opts.datasetDir),
      mkdirp(opts.componentDir)
    ]);
  });

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
    const stdoutStream = new StringWritable();
    const stderrStream = new StringWritable();
    const simple = await costa.fetch(path.join(__dirname, '../../test/plugins/nodejs-simple'));
    await costa.install(simple, { stdout: stdoutStream, stderr: stderrStream});
    tmp = await runnable.start(simple, { foobar: true });
    const stdout = stdoutStream.data;
    expect(stdout.search('{ foobar: true }') !== 0).toBe(true);
  }, INSTALL_SPECS_TIMEOUT);

  it('should start a python plugin', async () => {
    await mkdirp(path.join(__dirname, './plugins/python-simple/node_modules/@pipcook'));
    if (await pathExists(path.join(__dirname, './plugins/python-simple/node_modules/@pipcook/boa'))) {
      await remove(path.join(__dirname, './plugins/python-simple/node_modules/@pipcook/boa'));
    }
    await symlink(
      path.join(__dirname, '../../../boa'),
      path.join(__dirname, './plugins/python-simple/node_modules/@pipcook/boa')
    );
    const simple = await costa.fetch(path.join(__dirname, '../../test/plugins/python-simple'));
    const stdoutStream = new StringWritable();
    const stderrStream = new StringWritable();
    await costa.install(simple, { stdout: stdoutStream, stderr: stderrStream });
    expect(simple.pipcook.runtime).toBe('python');

    // test passing the variable from js to python.
    const tmp2 = await runnable.start(simple, tmp);
    const stdout = stdoutStream.data;
    expect(stdout.search('hello python!') !== 0).toBe(true);
    expect(stdout.search('fn1([0. 0.])') !== 0).toBe(true);
    expect(stdout.search('fn2()') !== 0).toBe(true);

    // test passing the variable from python to python.
    await runnable.start(simple, tmp2);
    const stdout2 = stdoutStream.data;
    expect(stdout2.search('hello python! [0. 0. 0. 0. 0. 0. 0. 0. 0. 0.]') !== 0).toBe(true);
  }, INSTALL_SPECS_TIMEOUT);

  it('should destroy the runnable', async () => {
    await runnable.destroy();
    const list = await readdir(costa.options.componentDir);
    expect(list.length).toBe(1);
  });
});
