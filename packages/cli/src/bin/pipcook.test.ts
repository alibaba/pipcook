import test from 'ava';
import * as sinon from 'sinon';
import * as fs from 'fs-extra';
import * as pipcook from './pipcook';
import { StandaloneRuntime } from '../runtime';

test.serial.afterEach(() => sinon.restore());

test.serial('fetch with cache', async (t) => {
  const mockFile = '/path/to/filename.json';
  const opts = {
    output: '/tmp',
    nocache: true,
    mirror: '',
    debug: false
  };
  const mockPipelineConfig = { mock: 'value' };
  const stubReadJson = sinon.stub(fs, 'readJson').resolves(mockPipelineConfig);
  const stubMkdirp = sinon.stub(fs, 'mkdirp').resolves();
  const stubCopy = sinon.stub(fs, 'copy').resolves();
  const stubRun = sinon.stub(StandaloneRuntime.prototype, 'run').resolves();
  await pipcook.run(mockFile, opts);
  t.true(stubReadJson.calledOnce, 'readJson should be called once');
  t.deepEqual(stubReadJson.args[0], [ '/tmp/filename.json' ] as any, 'should read the currect file');
  t.true(stubMkdirp.calledOnce, 'mkdirp should be called once');
  t.deepEqual(stubMkdirp.args[0], [ opts.output ] as any, 'should make the currect directory');
  t.true(stubRun.calledOnce, 'run should be called once');
  t.true(stubCopy.calledOnce, 'copy should be called once');
  t.deepEqual(stubCopy.args[0], [ mockFile, '/tmp/filename.json' ] as any, 'should make the currect directory');
});
