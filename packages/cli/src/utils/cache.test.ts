import test from 'ava';
import * as sinon from 'sinon';
import * as fs from 'fs-extra';
import { fetchWithCache } from './cache';
import * as core from '@pipcook/pipcook-core';

// export function mockFunctionFromGetter(obj: any, funcName: string): sinon.SinonStub {
//   const mockFunc = sinon.stub();
//   const getter = sinon.stub().returns(mockFunc);
//   sinon.stub(obj, funcName).get(getter);
//   return mockFunc;
// }

test('fetch with cache', async (t) => {
  const cacheDir = ".cache";
  const url = "url";
  const target = "target";

  const stubDownloadAndExtractTo = sinon.stub(core, 'downloadAndExtractTo').get(() => {'bar'});
  const stubRemove = sinon.stub(fs, 'remove').resolves();
  const stubPathExists = sinon.stub(fs, 'pathExists').resolves();
  const stubSymlink = sinon.stub(fs, 'symlink').resolves();

  await fetchWithCache(cacheDir, url, target);

  t.true(stubDownloadAndExtractTo.calledOnce);
  t.true(stubRemove.calledTwice);
  t.true(stubPathExists.calledOnce);
  t.true(stubSymlink.calledTwice);
});
