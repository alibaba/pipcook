import { ModelTrainType, UniModel, ImageDataset, ModelTrainArgsType } from '@pipcook/pipcook-core';
import * as path from 'path';

const boa = require('@pipcook/boa');
const sys = boa.import('sys');
const { tuple, int } = boa.builtins();
sys.path.insert(0, path.join(__dirname, '..'));
const { ImageGenerator } = boa.import('image_loader');

const cycleGANModelTrain: ModelTrainType = async (data: ImageDataset, model: UniModel, args: ModelTrainArgsType): Promise<UniModel> => {
  const { trainLoader } = data;
  console.log('len', await trainLoader.len())
  const aList = [];
  const bList = [];
  for(let i = 0; i < await trainLoader.len(); ++i) {
    const image = trainLoader.getItem(i);
    switch((await image).label.name.toLowerCase()) {
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
      resize: tuple([int(143), int(143)]),
      crop: tuple([int(128), int(128)])
    })
  );
  const IG_B = new ImageGenerator(
    boa.kwargs({
      fileList: bList,
      resize: tuple([int(143), int(143)]),
      crop: tuple([int(128), int(128)])
    })
  );
  model.model.fit(IG_A, IG_B);
  return model;
};

export default cycleGANModelTrain;
