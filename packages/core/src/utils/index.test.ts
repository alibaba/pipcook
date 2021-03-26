import test from 'ava';
import * as sinon from 'sinon';
import * as fs from 'fs-extra';
import * as utils from '.';
import * as path from 'path';
import { constants } from '..';

test.serial.afterEach(() => sinon.restore());

test('test if the array is shuffled', (t) => {
  const array = [ 1, 2, 3, 4, 5 ];
  utils.shuffle(array);
  array.sort();
  t.deepEqual(array, [ 1, 2, 3, 4, 5 ]);
});

test('compress dir to tmp dir', async (t) => {
  await fs.mkdirp(constants.PIPCOOK_TMPDIR);
  const tarFilename = path.join(constants.PIPCOOK_TMPDIR, utils.generateId() + '.tar');
  await utils.compressTarFile(__filename, tarFilename);
  t.true(await fs.pathExists(tarFilename));
  await fs.remove(tarFilename);
});

test('test if remote file was downloaded', async (t) => {
  const jsonFile = path.join(constants.PIPCOOK_TMPDIR, utils.generateId() + '.json');
  await t.notThrowsAsync(
    utils.download(
      'https://pipcook.oss-cn-hangzhou.aliyuncs.com/test/poet.song.91000.json',
      jsonFile
    ), 'should download successfully');
  console.log('download', jsonFile);
  t.true(await fs.pathExists(jsonFile), 'file should exist');
  const stats = await fs.stat(jsonFile);
  t.true(stats.size > 0, 'size should not be zero');
  await fs.remove(jsonFile);
});

test('download a nonexistent file', async (t) => {
  await t.throwsAsync(
    utils.download('http://unknown-host/nonexists.zip', './nonexistent.zip'),
    { instanceOf: Error }
  );
  await fs.remove('./nonexistent.zip');
});

test('download a invalid url', async (t) => {
  await t.throwsAsync(
    utils.download('abcd', './nonexistent.zip'),
    { instanceOf: Error }
  );
  await fs.remove('./nonexistent.zip');
});

test('downloadAndExtractTo a invalid url', async (t) => {
  await t.throwsAsync(
    utils.downloadAndExtractTo('abcd', 'whatever'),
    { instanceOf: TypeError }
  );
});

test('downloadAndExtractTo a ftp url', async (t) => {
  await t.throwsAsync(
    utils.downloadAndExtractTo('ftp://a.com/abcd.zip', 'whatever'),
    { instanceOf: TypeError }
  );
});

test.serial('downloadAndExtractTo local zip file', async (t) => {
  const stubUnzipData = sinon.stub(utils, 'unZipData').resolves();
  await utils.downloadAndExtractTo('file:///abcd.zip', 'tmp');
  t.true(stubUnzipData.calledOnce, 'unzipData should be called once');
  t.deepEqual(stubUnzipData.args[0], [ '/abcd.zip', 'tmp' ], 'should unzip the curruct file');
});

test.serial('downloadAndExtractTo https zip file', async (t) => {
  const stubUnzipData = sinon.stub(utils, 'unZipData').resolves();
  sinon.stub(utils, 'generateId').returns('id');
  await utils.downloadAndExtractTo('https://pipcook.oss-cn-hangzhou.aliyuncs.com/test/res.zip', constants.PIPCOOK_TMPDIR);
  t.true(stubUnzipData.calledOnce, 'unzipData should be called once');
  t.deepEqual(stubUnzipData.args[0], [ path.join(constants.PIPCOOK_TMPDIR, 'id'), constants.PIPCOOK_TMPDIR ], 'should unzip the curruct file');
});

test.serial('downloadAndExtractTo https non-zip file', async (t) => {
  const stubUnzipData = sinon.stub(utils, 'unZipData').resolves();
  sinon.stub(utils, 'generateId').returns('id');
  const stubDownload = sinon.stub(utils, 'download').resolves();
  const urlStr = 'https://pipcook.oss-cn-hangzhou.aliyuncs.com/test/res.jpg';
  const target = 'tmp';
  await utils.downloadAndExtractTo(urlStr, target);
  t.false(stubUnzipData.called, 'unzipData should not be called');
  t.true(stubDownload.calledOnce, 'download should be called once');
  t.deepEqual(stubDownload.args[0], [ urlStr, target ], 'should download the curruct file');
});

test.serial('downloadAndExtractTo local jpg file', async (t) => {
  const stubCopy = sinon.stub(fs, 'copy').resolves();
  await utils.downloadAndExtractTo('file:///abcd.jpg', 'tmp');
  t.true(stubCopy.calledOnce, 'fs.copy should be called once');
  t.deepEqual(stubCopy.args[0], [ '/abcd.jpg', 'tmp' ] as any, 'should copy the curruct file');
});

test.serial('download and unzip', async (t) => {
  const urlStr = 'https://pipcook.oss-cn-hangzhou.aliyuncs.com/test/res.zip';
  const targetPath = path.join(constants.PIPCOOK_TMPDIR, 'res.zip');
  const unzipDir = path.join(constants.PIPCOOK_TMPDIR, 'resDir');
  await utils.download(urlStr, targetPath);
  t.true(await fs.pathExists(targetPath), 'file should exist');
  await utils.unZipData(targetPath, unzipDir);
  t.true((await fs.readdir(unzipDir)).length > 0, 'should unzip files');
});

test('id generator', async (t) => {
  const id = utils.generateId();
  t.is(typeof id, 'string');
  t.is(id.length, 8);
  for (let i = 0; i < id.length; ++i) {
    const c = id.charCodeAt(i);
    t.true(c >= 'a'.charCodeAt(0) && c <= 'z'.charCodeAt(0)
      || c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0));
  }
});
