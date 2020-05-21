import { convertPascal2CocoFileOutput, createAnnotationFromJson } from './public';
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
});
