import { ModelTrainType, UniModel, ImageDataset, ModelTrainArgsType } from '@pipcook/pipcook-core';
const { dict } = require('@pipcook/boa').builtins();

/**
 * training parameters
 */
const trainOpt = {
  verbose: false,
  // save dir
  pic_dir: 'model',
  // images in batch
  batch_size: 1,
  // the number of training iteration
  niter: 100000,
  // the size of image buffer that stores previously generated images
  pool_size: 50,
  // the interval for saving model
  save_iter: 50,
  // the number of discriminator training times per iteration
  d_iter: 10
};

const cycleGANModelTrain: ModelTrainType = async (data: ImageDataset, model: UniModel, args: ModelTrainArgsType): Promise<UniModel> => {
  const opt = dict({
    ...trainOpt,
    ...args
  });
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

  model.model.fit(aList, bList, opt);
  return model;
};

export default cycleGANModelTrain;
