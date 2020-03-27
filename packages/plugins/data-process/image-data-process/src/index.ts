import {DataProcessType, ImageDataset, ArgsType, ImageDataLoader} from '@pipcook/pipcook-core';

import Jimp from 'jimp';
import cliProgress from 'cli-progress';

/**
 * @ignore
 * @param imagePaths 
 * @param resize 
 * @param normalize 
 */
const processImage = async (loader: ImageDataLoader, resize: number[], normalize: boolean) => {
  const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  const totalNumber = await loader.len();
  bar1.start(totalNumber, 0);
  for (let i = 0; i < totalNumber; i++) {
    bar1.update(i);
    const dataPath = await loader.getItem(i);
    let image = await Jimp.read(dataPath.data);
    image = image.resize(resize[0], resize[1]);
    if (normalize) {
      image = image.normalize();
    }
    await image.write(dataPath.data);
  }
  bar1.stop();
}

/**
 * this is the data process plugin to process pasvoc format data. It supports resize the image and normalize the image
 * @param resize =[256, 256][optional] resize all images to same size
 * @param normalize =false[optional] if normalize all images to have values between [0, 1]
 */
const pascolVocDataProcess: DataProcessType = async (data: ImageDataset, args: ArgsType): Promise<ImageDataset> => {
  const {
    resize = [256, 256],
    normalize = false
  } = args;

  const {trainLoader, validationLoader, testLoader} = data;

  if (trainLoader) {
    console.log('process train data');
    await processImage(trainLoader, resize, normalize);
  }
  
  if (validationLoader) {
    console.log('process validation data');
    await processImage(validationLoader, resize, normalize);
  }

  if (testLoader) {
    console.log('process test data');
    await processImage(testLoader, resize, normalize);
  }

  const result = data;

  result.metaData.feature = {
    shape: [resize[0], resize[1], 3]
  }

  return result;
}

export default pascolVocDataProcess;
