import { DataProcessType, Metadata, ArgsType, ImageSample, ImageProcessor } from '@pipcook/pipcook-core';

/**
 * this is the data process plugin to process pasvoc format data. It supports resize the image and normalize the image
 * @param resize =[256, 256][optional] resize all images to same size
 * @param minMaxNormalize =true[optional] if normalize all images to have values between [0, 1]
 * @param normalize =false[optional] if standardize all image by std and mean
 */
const imageDataProcess: DataProcessType = async (data: ImageSample, metadata: Metadata, args: ArgsType): Promise<void> => {
  const {
    resize = [256, 256],
    normalize = false,
    minMaxNormalize = true
  } = args;

  try {
    const processor = new ImageProcessor(data.data);
    if (minMaxNormalize) {
      processor.normalize();
    }
    if (resize) {
      processor.resize(resize);
    }
    if (normalize) {
      processor.standardize(normalize.std, normalize.mean);
    }
    await processor.excute().save(data.data);
  } catch (err) {
    console.error(`processing ${data.data} failed with ${err?.stack}`);
  }
  metadata.feature = {
    shape: [resize[0], resize[1], 3]
  };
};

export default imageDataProcess;
