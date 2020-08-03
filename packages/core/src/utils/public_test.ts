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
  getOsInfo
} from './public';
import * as fs from 'fs-extra';
import * as path from 'path';
import { generate } from 'shortid';
import { constants } from '..';
import { platform } from 'os';

const xml2js = require('xml2js');

describe('public utils', () => {
  it('should generate correct coco json from pascal voc format', async () => {
    const dir = process.cwd();
    const file = generate();
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
    expect(json.annotations[0].image_id).toBe(1);
    await fs.remove(file + '.json');
    await fs.remove(file + '.xml');
  });

  it('test if the array is shuffled', () => {
    const array = [ 1, 2, 3, 4, 5 ];
    shuffle(array);
    array.sort();
    expect(array).toEqual([ 1, 2, 3, 4, 5 ]);
  });

  it('test if annotation file was generated correctly', async () => {
    const annotationDir = path.join(constants.PIPCOOK_TMPDIR, 'testAnnotation');
    await fs.mkdirp(annotationDir);
    await createAnnotationFile(annotationDir, 'test.jpg', annotationDir, 'for-test');
    const xmlFilename = path.join(annotationDir, 'test.xml');
    const jsonData = await (new xml2js.Parser()).parseStringPromise(await fs.readFile(xmlFilename));
    expect(jsonData.annotation.filename[0]).toBe('test.jpg');
    expect(jsonData.annotation.folder[0]).toBe(annotationDir);
    expect(jsonData.annotation.object[0].name[0]).toBe('for-test');
    const parsedData = await parseAnnotation(xmlFilename);
    expect(parsedData.annotation.filename[0]).toBe('test.jpg');
    expect(parsedData.annotation.folder[0]).toBe(annotationDir);
    expect(parsedData.annotation.object[0].name[0]).toBe('for-test');
    fs.remove(annotationDir);
  });
  it('test get the model path name', () => {
    const pathname = getModelDir('test');
    expect(pathname.endsWith('test/model')).toBe(true);
  });
  it('test transformCsv', () => {
    const strFromCsv = transformCsv('1, 2, "a", "b", 3.14, "2020-07-18 13:51:00", "img.jpg"');
    expect(strFromCsv).toBe('"1, 2, ""a"", ""b"", 3.14, ""2020-07-18 13:51:00"", ""img.jpg"""');
  });
  it('test os info', async () => {
    const os = await getOsInfo();
    switch (platform()) {
    case 'linux':
      expect(os).toBe('linux');
      break;
    case 'darwin':
      expect(os).toBe('mac');
      break;
    case 'win32':
      expect(os).toBe('windows');
      break;
    default:
      expect(os).toBe('other');
    }
  });
});

describe('test compress utils', () => {
  it('compress dir to tmp dir', async () => {
    const tarFilename = path.join(constants.PIPCOOK_TMPDIR, generate() + '.tar');
    await compressTarFile(__filename, tarFilename);
    expect(await fs.pathExists(tarFilename)).toEqual(true);
    await fs.remove(tarFilename);
  });
});
describe('test downloading utils', () => {
  const TIMEOUT = 30 * 1000;
  it('download a remote zip package and extract to tmp dir', async () => {
    const tmpDir = await downloadAndExtractTo('http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textClassification.zip');
    expect(await fs.pathExists(tmpDir + '/test')).toEqual(true);
    expect(await fs.pathExists(tmpDir + '/train')).toEqual(true);
    await fs.remove(tmpDir);
  }, TIMEOUT);
  it('download a remote json file to tmp dir', async () => {
    const tmpDir = await downloadAndExtractTo('https://raw.githubusercontent.com/DavidCai1993/chinese-poem-generator.js/master/test/data/poet.song.91000.json');
    expect(tmpDir.indexOf('poet.song.91000.json') !== -1).toEqual(true);
    expect(await fs.pathExists(tmpDir)).toEqual(true);
    await fs.remove(tmpDir);
  }, TIMEOUT);
  it('download from local directory', async () => {
    const tmpDir = await downloadAndExtractTo('http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textClassification.zip');
    const tmpDir2 = await downloadAndExtractTo(`file://${tmpDir}`);
    expect(await fs.pathExists(tmpDir2 + '/test')).toEqual(true);
    expect(await fs.pathExists(tmpDir2 + '/train')).toEqual(true);
    await fs.remove(tmpDir);
    await fs.remove(tmpDir2);
  }, TIMEOUT);
  it('download from local directory', async () => {
    const tmpDir = await downloadAndExtractTo('http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textClassification.zip');
    const tmpDir2 = await downloadAndExtractTo(`file://${tmpDir}`);
    expect(await fs.pathExists(tmpDir2 + '/test')).toEqual(true);
    expect(await fs.pathExists(tmpDir2 + '/train')).toEqual(true);
    await fs.remove(tmpDir);
    await fs.remove(tmpDir2);
  }, TIMEOUT);
  it('test if remote file was downloaded', async () => {
    const jsonFile = path.join(constants.PIPCOOK_TMPDIR, generate() + '.json');
    await download('https://raw.githubusercontent.com/DavidCai1993/chinese-poem-generator.js/master/test/data/poet.song.91000.json', jsonFile);
    expect(await fs.pathExists(jsonFile)).toBe(true);
    const stats = await fs.stat(jsonFile);
    expect(stats.size).toBeGreaterThan(0);
  });
});
