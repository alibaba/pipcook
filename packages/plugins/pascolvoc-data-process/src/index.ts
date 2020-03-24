import {DataProcessType, PascolVocSampleData, ArgsType} from '@pipcook/pipcook-core';

import * as path from 'path';
import * as assert from 'assert';
import Jimp from 'jimp';
import glob from 'glob-promise';
import cliProgress from 'cli-progress';

/**
 * @ignore
 * @param imagePaths 
 * @param resize 
 * @param normalize 
 */
const processImage = async (imagePaths: string[], resize: number[], normalize: boolean) => {
  const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar1.start(imagePaths.length, 0);
  for (let i = 0; i < imagePaths.length; i++) {
    bar1.update(i);
    let image = await Jimp.read(imagePaths[i]);
    image = image.resize(resize[0], resize[1]);
    if (normalize) {
      image = image.normalize();
    }
    await image.write(imagePaths[i]);
  }
  bar1.stop();
}

/**
 * this is the data process plugin to process pasvoc format data. It supports resize the image and normalize the image
 * @param resize =[256, 256][optional] resize all images to same size
 * @param normalize =false[optional] if normalize all images to have values between [0, 1]
 */
const pascolVocDataProcess: DataProcessType = async (data: PascolVocSampleData, args: ArgsType): Promise<PascolVocSampleData> => {
  const {
    dataDir, 
    resize = [256, 256],
    normalize = false
  } = args;

  const {trainData, validationData, testData} = data;
  assert.ok(trainData !== undefined, 'no train data found!');

  const trainPaths = await glob(path.join(dataDir, 'train', '*.+(jpg|jpeg|png)'));
  await processImage(trainPaths, resize, normalize);

  if (validationData) {
    const validationPaths = await glob(path.join(dataDir, 'validation', '*.+(jpg|jpeg|png)'));
    await processImage(validationPaths, resize, normalize);
  }

  if (testData) {
    const testPaths = await glob(path.join(dataDir, 'test', '*.+(jpg|jpeg|png)'));
    await processImage(testPaths, resize, normalize);
  }

  const result = data;

  result.metaData.feature = {
    shape: [resize[0], resize[1], 3]
  }

  return result;
}

export default pascolVocDataProcess;
