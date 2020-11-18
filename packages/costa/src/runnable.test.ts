import * as path from 'path';
import { readdir, ensureSymlink, mkdirp, remove } from 'fs-extra';
import { Writable } from 'stream';
import { CostaRuntime } from '../src/runtime';
import { PluginRunnable } from '../src/runnable';

class StringWritable extends Writable {
  data = '';
  constructor() {
    super();
  }

  _write(chunk: any, encoding: string, callback: (error?: Error | null) => void): void {
    this.data += chunk;
    callback();
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
  let logger = {
    stdout: new StringWritable(),
    stderr: new StringWritable()
  };
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
    runnable = new PluginRunnable(costa, logger);
    expect(runnable.workingDir).toBeInstanceOf(String);
    expect(runnable.state).toBe('init');
  });

  it('should bootstrap the runnable', async () => {
    await runnable.bootstrap({
      pluginNotRespondingTimeout: 2000,
    });
    expect(runnable.state).toBe('idle');
  });

  let tmp: any;
  it('should start a nodejs plugin', async () => {
    const simple = await costa.fetch(path.join(__dirname, '../tests/plugins/nodejs-simple'));
    await costa.install(simple, process);
    tmp = await runnable.start(simple, { foobar: true });
    const stdoutString = logger.stdout.data.toString();
    expect(stdoutString.indexOf('{ foobar: true }') >= 0).toBe(true);
  });

  it('should start a nodejs plugin with blocking', async () => {
    const simple = await costa.fetch(path.join(__dirname, '../tests/plugins/nodejs-not-responding'));
    await costa.install(simple, process);
    try {
      await runnable.start(simple, { foobar: true });
    } catch (err) {
      console.log('!!!', err);
    }
  });

  it('should start a python plugin', async () => {
    await ensureSymlink(
      path.join(__dirname, '../../boa'),
      path.join(__dirname, '../tests/plugins/python-simple/node_modules/@pipcook/boa')
    );
    const simple = await costa.fetch(path.join(__dirname, '../tests/plugins/python-simple'));
    await costa.install(simple, process);
    expect(simple.pipcook.runtime).toBe('python');
    // test passing the variable from js to python.
    const tmp2 = await runnable.start(simple, tmp);
    const stdout = logger.stdout.data.toString();
    expect(stdout.indexOf('hello python!') >= 0).toBe(true, 'hello python check failed');
    expect(stdout.indexOf('fn1([0. 0.])') >= 0).toBe(true, 'fn1 check failed');
    expect(stdout.indexOf('fn2()') >= 0).toBe(true, 'fn2 check failed');

    // test passing the variable from python to python.
    await runnable.start(simple, tmp2);
    const stdout2 = logger.stdout.data;
    expect(stdout2.indexOf('hello python! [0. 0. 0. 0. 0. 0. 0. 0. 0. 0.]') >= 0).toBe(true, 'stdout2 check failed');
  });

  it('should start a python plugin with scope package name', async () => {
    await ensureSymlink(
      path.join(__dirname, '../../boa'),
      path.join(__dirname, '../tests/plugins/python-scope/node_modules/@pipcook/boa'),
      'dir'
    );
    const simple = await costa.fetch(path.join(__dirname, '../tests/plugins/python-scope'));
    await costa.install(simple, process);
    // test if the plugin is executed successfully
    await runnable.start(simple, tmp);
    const stdout = logger.stdout.data;
    expect(stdout.indexOf('hello python!') >= 0).toBe(true);
  });

  it('should destroy the runnable', async () => {
    await runnable.destroy();
    const list = await readdir(costa.options.componentDir);
    expect(list.length).toBe(1);
  });

  it('should destroy the runnable when it loops', async () => {
    const logger = process;
    const costa = new CostaRuntime(opts);
    runnable = new PluginRunnable(costa, logger);
    await runnable.bootstrap({ logger });
    const simple = await costa.fetch(path.join(__dirname, '../tests/plugins/nodejs-simple'));
    await costa.install(simple, logger);
    setTimeout(() => {
      runnable.destroy();
    }, 1000);
    const start = Date.now();
    await expectAsync(runnable.start(simple, { foobar: true, exitAfter: 5 })).toBeRejected();
    const cost = Date.now() - start;
    expect(cost < 5000);
    console.log(`child process exited after ${cost}ms`);
  });
});
