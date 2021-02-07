import test from 'ava';
import * as sinon from 'sinon';
import * as fs from 'fs-extra';
import * as utils from '.';
import * as path from 'path';
import { constants } from '..';
import * as xml2js from 'xml2js';

test.serial.afterEach(() => sinon.restore());

test('should generate correct coco json from pascal voc format', async (t) => {
  const dir = process.cwd();
  const file = utils.generateId();
  await utils.createAnnotationFromJson(dir, {
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

  await utils.convertPascal2CocoFileOutput([ path.join(dir, file + '.xml') ], path.join(dir, file + '.json'));
  const json = await fs.readJSON(path.join(dir, file + '.json'));
  t.is(json.annotations[0].image_id, 1);
  await fs.remove(file + '.json');
  await fs.remove(file + '.xml');
});

test('test if the array is shuffled', (t) => {
  const array = [ 1, 2, 3, 4, 5 ];
  utils.shuffle(array);
  array.sort();
  t.deepEqual(array, [ 1, 2, 3, 4, 5 ]);
});

test('test if annotation file was generated correctly', async (t) => {
  const annotationDir = path.join(constants.PIPCOOK_TMPDIR, 'testAnnotation');
  await fs.mkdirp(annotationDir);
  await utils.createAnnotationFile(annotationDir, 'test.jpg', annotationDir, 'for-test');
  const xmlFilename = path.join(annotationDir, 'test.xml');
  const jsonData = await (new xml2js.Parser()).parseStringPromise(await fs.readFile(xmlFilename));
  t.is(jsonData.annotation.filename[0], 'test.jpg');
  t.is(jsonData.annotation.folder[0], annotationDir);
  t.is(jsonData.annotation.object[0].name[0], 'for-test');
  const parsedData = await utils.parseAnnotation(xmlFilename);
  t.is(parsedData.annotation.filename[0], 'test.jpg');
  t.is(parsedData.annotation.folder[0], annotationDir);
  t.is(parsedData.annotation.object[0].name[0], 'for-test');
  fs.remove(annotationDir);
});

test('test transformCsv', (t) => {
  const strFromCsv = utils.transformCsv('1, 2, "a", "b", 3.14, "2020-07-18 13:51:00", "img.jpg"');
  t.is(strFromCsv, '"1, 2, ""a"", ""b"", 3.14, ""2020-07-18 13:51:00"", ""img.jpg"""');
});

test('test transformCsv with one element', (t) => {
  const strFromCsv = utils.transformCsv('1');
  t.is(strFromCsv, '1');
});

test('test transformCsv without string', (t) => {
  const strFromCsv = utils.transformCsv('1, 2');
  t.is(strFromCsv, '"1, 2"');
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
  await utils.download('https://raw.githubusercontent.com/DavidCai1993/chinese-poem-generator.js/master/test/data/poet.song.91000.json', jsonFile);
  t.true(await fs.pathExists(jsonFile));
  const stats = await fs.stat(jsonFile);
  t.true(stats.size > 0);
  await fs.remove(jsonFile);
});

// test('download a nonexistent file', async (t) => {
//   await t.throwsAsync(
//     utils.download('http://unknown-host/nonexists.zip', './nonexistent.zip'),
//     { instanceOf: Error }
//   );
//   await fs.remove('./nonexistent.zip');
// });

// test('download a invalid url', async (t) => {
//   await t.throwsAsync(
//     utils.download('abcd', './nonexistent.zip'),
//     { instanceOf: Error }
//   );
//   await fs.remove('./nonexistent.zip');
// });

// test('downloadAndExtractTo a invalid url', async (t) => {
//   await t.throwsAsync(
//     utils.downloadAndExtractTo('abcd', 'whatever'),
//     { instanceOf: TypeError }
//   );
// });

// test('downloadAndExtractTo a ftp url', async (t) => {
//   await t.throwsAsync(
//     utils.downloadAndExtractTo('ftp://a.com/abcd.zip', 'whatever'),
//     { instanceOf: TypeError }
//   );
// });

// test.serial('downloadAndExtractTo local zip file', async (t) => {
//   const stubUnzipData = sinon.stub(utils, 'unZipData').resolves();
//   await utils.downloadAndExtractTo('file:///abcd.zip', 'tmp');
//   t.true(stubUnzipData.calledOnce, 'unzipData should be called once');
//   t.deepEqual(stubUnzipData.args[0], [ '/abcd.zip', 'tmp' ], 'should unzip the curruct file');
// });

// test.serial('downloadAndExtractTo local jpg file', async (t) => {
//   const stubCopy = sinon.stub(fs, 'copy').resolves();
//   await utils.downloadAndExtractTo('file:///abcd.jpg', 'tmp');
//   t.true(stubCopy.calledOnce, 'fs.copy should be called once');
//   t.deepEqual(stubCopy.args[0], [ '/abcd.jpg', 'tmp' ] as any, 'should copy the curruct file');
// });

// test('id generator', async (t) => {
//   const id = utils.generateId();
//   t.is(typeof id, 'string');
//   t.is(id.length, 8);
//   for (let i = 0; i < id.length; ++i) {
//     const c = id.charCodeAt(i);
//     t.true(c >= 'a'.charCodeAt(0) && c <= 'z'.charCodeAt(0)
//       || c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0));
//   }
// });
