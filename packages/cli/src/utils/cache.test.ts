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

  t.false(stubDownloadAndExtractTo.called);
  t.true(stubRemove.calledOnce);
  t.true(stubPathExists.calledOnce);
  t.true(stubSymlink.called);
});

test.serial('fetch with missed cache', async (t) => {
  const cacheDir = '.cache';
  const url = 'url';
  const target = 'target';

  const stubDownloadAndExtractTo = sinon.stub(utils, 'downloadAndExtractTo').resolves();
  const stubRemove = sinon.stub(fs, 'remove').resolves();
  const stubPathExists = sinon.stub(fs, 'pathExists').resolves(false);
  const stubSymlink = sinon.stub(fs, 'symlink').resolves();

  await fetchWithCache(cacheDir, url, target);

  t.true(stubDownloadAndExtractTo.calledOnce);
  t.true(stubRemove.calledTwice);
  t.true(stubPathExists.calledOnce);
  t.true(stubSymlink.calledOnce);
});

test.serial('fetch with disabled cache', async (t) => {
  const cacheDir = '.cache';
  const url = 'url';
  const target = 'target';

  const stubDownloadAndExtractTo = sinon.stub(utils, 'downloadAndExtractTo').resolves();
  const stubRemove = sinon.stub(fs, 'remove').resolves();
  const stubPathExists = sinon.stub(fs, 'pathExists').resolves(true);
  const stubSymlink = sinon.stub(fs, 'symlink').resolves();

  await fetchWithCache(cacheDir, url, target, false);

  t.true(stubDownloadAndExtractTo.calledOnce);
  t.true(stubRemove.calledTwice);
  t.false(stubPathExists.called);
  t.true(stubSymlink.calledOnce);
});
