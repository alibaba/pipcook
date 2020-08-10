import { DataProcessType, Metadata, ArgsType, ImageSample, Sample } from '@pipcook/pipcook-core';

const boa = require('@pipcook/boa');
const tf = boa.import('tensorflow');

/**
 * this is the data process plugin to process pasvoc format data. It supports resize the image and normalize the image
 * @param resize =[256, 256][optional] resize all images to same size
 * @param normalize =false[optional] if normalize all images to have values between [0, 1]
 */
const imageDataProcess: DataProcessType = async (data: ImageSample, metadata: Metadata, args: ArgsType): Promise<Sample> => {
  const {
    resize = [ 256, 256 ],
    normalize = false
  } = args;

  const content = tf.io.read_file(data.data);
  let image = tf.image.decode_jpeg(content, boa.kwargs({
    channels: 3
  }));
  if (resize) {
    image = tf.image.resize(image, resize);
  }
  if (normalize) {
    image = tf.divide(image, 255);
  }

  const ys = tf.one_hot(data.label.categoryId, Object.keys(metadata.labelMap).length);

  metadata.feature = {
    shape: [ resize[0], resize[1], 3 ]
  };

  return {
    data: image,
    label: ys
  };
};

export default imageDataProcess;
