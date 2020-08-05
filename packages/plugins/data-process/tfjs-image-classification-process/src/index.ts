import { DataProcessType, Metadata, ArgsType, ImageSample, Sample } from '@pipcook/pipcook-core';
import * as fs from 'fs-extra';
import * as tf from '@tensorflow/tfjs-node-gpu';

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

  const content = await fs.readFile(data.data);
  const uarr = new Uint8Array(content);
  const imageArr = tf.node.decodeJpeg(uarr, 3);
  let xs = tf.tidy(() => tf.cast(imageArr, 'float32'));
  if (resize) {
    xs = tf.image.resizeBilinear(xs, resize);
  }
  if(normalize) {
    xs = tf.div(xs, 255);
  }
  const label = data.label.categoryId;
  const ys = tf.tidy(() => tf.oneHot(tf.scalar(label, 'int32'), Object.keys(metadata.labelMap).length))

  metadata.feature = {
    shape: [ resize[0], resize[1], 3 ]
  };


  return {
    data: xs,
    label: ys
  }
};

export default imageDataProcess;
