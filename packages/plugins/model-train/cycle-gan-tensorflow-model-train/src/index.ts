import { ModelTrainType, UniModel, ImageDataset, ModelTrainArgsType } from '@pipcook/pipcook-core';
import * as path from 'path';

const boa = require('@pipcook/boa');
const sys = boa.import('sys');
const { tuple, int } = boa.builtins();
sys.path.insert(0, path.join(__dirname, '..'));
const { ImageGenerator } = boa.import('image_loader');

const cycleGANModelTrain: ModelTrainType = async (data: ImageDataset, model: UniModel, args: ModelTrainArgsType): Promise<UniModel> => {
  const {
    resize = [ 143, 143 ],
    crop = [ 128, 128 ]
  } = args;
  const { trainLoader } = data;
  const aList = [];
  const bList = [];
  for (let i = 0; i < await trainLoader.len(); ++i) {
    const image = trainLoader.getItem(i);
    switch ((await image).label.name.toLowerCase()) {
    case 'a':
      aList.push((await image).data);
      break;
    case 'b':
      bList.push((await image).data);
      break;
    default:
      console.warn('unknown type of ', (await image).data);
      break;
    }
  }

  const IG_A = new ImageGenerator(
    boa.kwargs({
      fileList: aList,
      resize: tuple([ int(resize[0]), int(resize[1]) ]),
      crop: tuple([ int(crop[0]), int(crop[1]) ])
    })
  );
  const IG_B = new ImageGenerator(
    boa.kwargs({
      fileList: bList,
      resize: tuple([ int(resize[0]), int(resize[1]) ]),
      crop: tuple([ int(crop[0]), int(crop[1]) ])
    })
  );
  model.model.fit(IG_A, IG_B);
  return model;
};

export default cycleGANModelTrain;
