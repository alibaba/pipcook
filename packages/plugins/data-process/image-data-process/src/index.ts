import { DataProcessType, Metadata, ArgsType, ImageSample } from '@pipcook/pipcook-core';

import Jimp from 'jimp';

/**
 * this is the data process plugin to process pasvoc format data. It supports resize the image and normalize the image
 * @param resize =[256, 256][optional] resize all images to same size
 * @param normalize =false[optional] if normalize all images to have values between [0, 1]
 */
const imageDataProcess: DataProcessType = async (data: ImageSample, metadata: Metadata, args: ArgsType): Promise<void> => {
  const {
    resize = [ 256, 256 ],
    normalize = false
  } = args;

  try {
    let image = await Jimp.read(data.data);
    image = image.resize(resize[0], resize[1]);
    if (normalize) {
      image = image.normalize();
    }
    await image.writeAsync(data.data);
  } catch (err) {
    console.error(`processing ${data.data} failed with ${err?.stack}`);
  }

  metadata.feature = {
    shape: [ resize[0], resize[1], 3 ]
  };
};

export default imageDataProcess;
