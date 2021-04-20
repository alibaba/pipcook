import test from 'ava';
import * as sinon from 'sinon';
import * as fs from 'fs-extra';
import { fetchWithCache } from './cache';
import * as utils from '.';

test.serial.afterEach(() => sinon.restore());

test.serial('fetch with cache', async (t) => {
  const cacheDir = '.cache';
  const url = 'url';
  const target = 'target';

  const stubDownloadAndExtractTo = sinon.stub(utils, 'downloadAndExtractTo').resolves();
  const stubRemove = sinon.stub(fs, 'remove').resolves();
  const stubPathExists = sinon.stub(fs, 'pathExists').resolves(true);
  const stubSymlink = sinon.stub(fs, 'symlink').resolves();

  await fetchWithCache(cacheDir, url, target);

  t.false(stubDownloadAndExtractTo.called, 'downloadAndExtractTo function should not called.');
  t.true(stubRemove.calledOnce, 'fs.remove function should called once.');
  t.true(stubPathExists.calledOnce, 'fs.pathExists function should called once.');
  t.true(stubSymlink.called, 'fs.symlink function should called.');
});

test.serial('fetch with missed cache', async (t) => {
  const cacheDir = '.cache';
  const url = 'url';
  const target = 'target';

  const stubDownloadAndExtractTo = sinon.stub(utils, 'downloadAndExtractTo').resolves();
  const stubRemove = sinon.stub(fs, 'remove').resolves();
  const stubMove = sinon.stub(fs, 'move').resolves();
  const stubPathExists = sinon.stub(fs, 'pathExists').resolves(false);
  const stubSymlink = sinon.stub(fs, 'symlink').resolves();

  await fetchWithCache(cacheDir, url, target);

  t.true(stubDownloadAndExtractTo.calledOnce, 'downloadAndExtractTo function should called once.');
  t.true(stubRemove.calledThrice, 'fs.remove function should three times.');
  t.true(stubMove.calledOnce, 'fs.move function should called once.');
  t.true(stubPathExists.calledOnce, 'fs.pathExists function should called once.');
  t.true(stubSymlink.calledOnce, 'fs.symlink function should called once.');
});

test.serial('fetch with disabled cache', async (t) => {
  const cacheDir = '.cache';
  const url = 'url';
  const target = 'target';

  const stubDownloadAndExtractTo = sinon.stub(utils, 'downloadAndExtractTo').resolves();
  const stubRemove = sinon.stub(fs, 'remove').resolves();
  const stubMove = sinon.stub(fs, 'move').resolves();
  const stubPathExists = sinon.stub(fs, 'pathExists').resolves(true);
  const stubSymlink = sinon.stub(fs, 'symlink').resolves();

  await fetchWithCache(cacheDir, url, target, false);

  t.true(stubDownloadAndExtractTo.calledOnce, 'downloadAndExtractTo function should called once.');
  t.true(stubRemove.calledThrice, 'fs.remove function should three times.');
  t.true(stubMove.calledOnce, 'fs.move function should called once.');
  t.false(stubPathExists.called, 'fs.pathExists function should not called once.');
  t.true(stubSymlink.calledOnce, 'fs.symlink function should called once.');
});
