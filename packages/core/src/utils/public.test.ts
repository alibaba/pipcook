import test from 'ava';
import * as sinon from 'sinon';
import * as fs from 'fs-extra';
import {
  convertPascal2CocoFileOutput,
  createAnnotationFromJson,
  shuffle,
  createAnnotationFile,
  parseAnnotation,
  download,
  // download utils
  downloadAndExtractTo,
  compressTarFile,
  getModelDir,
  transformCsv,
  generateId,
  getMetadata
} from './public';
import * as path from 'path';
import { constants } from '..';

const xml2js = require('xml2js');

test.serial.afterEach(() => sinon.restore());

test('should generate correct coco json from pascal voc format', async (t) => {
  const dir = process.cwd();
  const file = generateId();
  await createAnnotationFromJson(dir, {
    annotation: {
      folder: [
        dir
      ],
      filename: [
        file + '.jpg'
      ],
      size: [
        {
          width: [
            '750'
          ],
          height: [
            '310'
          ]
        }
      ],
      object: [
        {
          name: [
            'test'
          ],
          bndbox: [
            {
              xmin: [
                '134'
              ],
              ymin: [
                '0'
              ],
              xmax: [
                '325'
              ],
              ymax: [
                '310'
              ]
            }
          ]
        }
      ]
    }
  });

  await convertPascal2CocoFileOutput([ path.join(dir, file + '.xml') ], path.join(dir, file + '.json'));
  const json = await fs.readJSON(path.join(dir, file + '.json'));
  t.is(json.annotations[0].image_id, 1);
  await fs.remove(file + '.json');
  await fs.remove(file + '.xml');
});

test('test if the array is shuffled', (t) => {
  const array = [ 1, 2, 3, 4, 5 ];
  shuffle(array);
  array.sort();
  t.deepEqual(array, [ 1, 2, 3, 4, 5 ]);
});

test('test if annotation file was generated correctly', async (t) => {
  const annotationDir = path.join(constants.PIPCOOK_TMPDIR, 'testAnnotation');
  await fs.mkdirp(annotationDir);
  await createAnnotationFile(annotationDir, 'test.jpg', annotationDir, 'for-test');
  const xmlFilename = path.join(annotationDir, 'test.xml');
  const jsonData = await (new xml2js.Parser()).parseStringPromise(await fs.readFile(xmlFilename));
  t.is(jsonData.annotation.filename[0], 'test.jpg');
  t.is(jsonData.annotation.folder[0], annotationDir);
  t.is(jsonData.annotation.object[0].name[0], 'for-test');
  const parsedData = await parseAnnotation(xmlFilename);
  t.is(parsedData.annotation.filename[0], 'test.jpg');
  t.is(parsedData.annotation.folder[0], annotationDir);
  t.is(parsedData.annotation.object[0].name[0], 'for-test');
  fs.remove(annotationDir);
});

test('test get the model path name', (t) => {
  const pathname = getModelDir('test');
  t.true(pathname.endsWith('test/model'));
});

test('test transformCsv', (t) => {
  const strFromCsv = transformCsv('1, 2, "a", "b", 3.14, "2020-07-18 13:51:00", "img.jpg"');
  t.is(strFromCsv, '"1, 2, ""a"", ""b"", 3.14, ""2020-07-18 13:51:00"", ""img.jpg"""');
});

test('test transformCsv with one element', (t) => {
  const strFromCsv = transformCsv('1');
  t.is(strFromCsv, '1');
});

test('test transformCsv without string', (t) => {
  const strFromCsv = transformCsv('1, 2');
  t.is(strFromCsv, '"1, 2"');
});

test.serial('test getMetaData', async (t) => {
  const mockReadJson = sinon.stub(fs, 'readJSON').resolves({ metadata: {} });
  const data = await getMetadata('job-id');
  t.deepEqual(data, {});
  t.true(mockReadJson.calledOnce);
  t.deepEqual(mockReadJson.args[0], [ path.join(constants.PIPCOOK_LOGS, 'job-id', 'log.json') ] as any);
});

test.serial('test getMetaData with undefined', async (t) => {
  const mockReadJson = sinon.stub(fs, 'readJSON').resolves({});
  const data = await getMetadata('job-id');
  t.is(data, undefined);
  t.true(mockReadJson.calledOnce);
  t.deepEqual(mockReadJson.args[0], [ path.join(constants.PIPCOOK_LOGS, 'job-id', 'log.json') ] as any);
});

test('test getMetaData with nonexistent file', async (t) => {
  await t.throwsAsync(getMetadata('nonexistent-id'), { instanceOf: TypeError });
});

test('compress dir to tmp dir', async (t) => {
  const tarFilename = path.join(constants.PIPCOOK_TMPDIR, generateId() + '.tar');
  await compressTarFile(__filename, tarFilename);
  t.true(await fs.pathExists(tarFilename));
  await fs.remove(tarFilename);
});

test('download a remote zip package and extract to tmp dir', async (t) => {
  const tmpDir = await downloadAndExtractTo('http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textClassification.zip');
  t.true(await fs.pathExists(tmpDir + '/test'));
  t.true(await fs.pathExists(tmpDir + '/train'));
  await fs.remove(tmpDir);
});
test('download a remote json file to tmp dir', async (t) => {
  const tmpDir = await downloadAndExtractTo('https://raw.githubusercontent.com/DavidCai1993/chinese-poem-generator.js/master/test/data/poet.song.91000.json');
  t.true(tmpDir.indexOf('poet.song.91000.json') !== -1);
  t.true(await fs.pathExists(tmpDir));
  await fs.remove(tmpDir);
});
test('download from local directory', async (t) => {
  const tmpDir = await downloadAndExtractTo('http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textClassification.zip');
  const tmpDir2 = await downloadAndExtractTo(`file://${tmpDir}`);
  t.true(await fs.pathExists(tmpDir2 + '/test'));
  t.true(await fs.pathExists(tmpDir2 + '/train'));
  await fs.remove(tmpDir);
  await fs.remove(tmpDir2);
});
test('test if remote file was downloaded', async (t) => {
  const jsonFile = path.join(constants.PIPCOOK_TMPDIR, generateId() + '.json');
  await download('https://raw.githubusercontent.com/DavidCai1993/chinese-poem-generator.js/master/test/data/poet.song.91000.json', jsonFile);
  t.true(await fs.pathExists(jsonFile));
  const stats = await fs.stat(jsonFile);
  t.true(stats.size > 0);
});
test('download a nonexistent file', async (t) => {
  await t.throwsAsync(
    download('http://unknown-host/nonexists.zip', './nonexistent.zip')
  , { instanceOf: TypeError });
  await fs.remove('./nonexistent.zip');
});
test('download a invalid url', async (t) => {
  await t.throwsAsync(
    download('abcd', './nonexistent.zip'),
    { instanceOf: TypeError }
  );
  await fs.remove('./nonexistent.zip');
});
test('id generator', async (t) => {
  const id = generateId();
  t.is(typeof id, 'string');
  t.is(id.length, 8);
  for (let i = 0; i < id.length; ++i) {
    const c = id.charCodeAt(i);
    t.true(c >= 'a'.charCodeAt(0) && c <= 'z'.charCodeAt(0)
      || c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0));
  }
});
