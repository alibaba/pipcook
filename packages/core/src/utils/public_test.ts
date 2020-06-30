import {
  convertPascal2CocoFileOutput,
  createAnnotationFromJson,
  shuffle,
  // download utils
  downloadAndExtractTo
} from './public';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as uuid from 'uuid';

describe('public utils', () => {
  it('should generate correct coco json from pascal voc format', async () => {
    const dir = process.cwd();
    const file = uuid.v1();
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
});

describe('test downloading utils', () => {
  it('download a remote zip package and extract to tmp dir', async () => {
    const tmpDir = await downloadAndExtractTo('http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textClassification.zip');
    expect(await fs.pathExists(tmpDir + '/test')).toEqual(true);
    expect(await fs.pathExists(tmpDir + '/train')).toEqual(true);
    await fs.remove(tmpDir);
  }, 10 * 1000);
  it('download a remote json file to tmp dir', async () => {
    const tmpDir = await downloadAndExtractTo('https://raw.githubusercontent.com/DavidCai1993/chinese-poem-generator.js/master/test/data/poet.song.91000.json');
    expect(tmpDir.indexOf('poet.song.91000.json') !== -1).toEqual(true);
    expect(await fs.pathExists(tmpDir)).toEqual(true);
    await fs.remove(tmpDir);
  }, 10 * 1000);
  it('download from local directory', async () => {
    const tmpDir = await downloadAndExtractTo('http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textClassification.zip');
    const tmpDir2 = await downloadAndExtractTo(`file://${tmpDir}`);
    expect(await fs.pathExists(tmpDir2 + '/test')).toEqual(true);
    expect(await fs.pathExists(tmpDir2 + '/train')).toEqual(true);
    await fs.remove(tmpDir);
    await fs.remove(tmpDir2);
  });
});
