/**
 * @file This is the main file for plugin used to pre-process the image classification data. It supports randomly rotate, brightness, normalize data.
 */
import {DataProcessType, UniformTfSampleData, MetaData, ArgsType} from '@pipcook/pipcook-core'
import * as tf from '@tensorflow/tfjs-node-gpu';
import * as assert from 'assert';
import Jimp from 'jimp';


const processImage = async (processingData: any, rotationRange: number, brightnessRange: number, normalization: boolean, metaData: MetaData) => {
  const image = processingData[metaData.feature.name];
  const label = processingData[metaData.label.name];
  const imageEncode = await tf.node.encodeJpeg(image);
  const imageBuffer = imageEncode.buffer as Buffer;
  let trainImage = await Jimp.read(imageBuffer);
  if (rotationRange) {
    trainImage = trainImage.rotate((Math.random() - 0.5) * 2 * rotationRange, false);
  }
  if (brightnessRange) {
    trainImage = trainImage.brightness((Math.random() - 0.5) * 2 * brightnessRange);
  }
  if (normalization) {
    trainImage = trainImage.normalize();
  }
  const trainImageBuffer = await trainImage.getBufferAsync(Jimp.MIME_JPEG);
  const imageArray = new Uint8Array(trainImageBuffer);

  return {
    xs: tf.cast(tf.node.decodeImage(imageArray, 3), 'float32'),
    ys: label
  }
}

/**
 * main function of this plugin operator.
 * @param data : smaple data
 * @param normalization : if normalize the data
 * @param rotationRange : if rotate randomly
 * @param brightnessRange : if adjust brightness randomly
 */
const imageClassDataProcess: DataProcessType = async (data: UniformTfSampleData, args?: ArgsType): Promise<UniformTfSampleData> => {
  let normalization: boolean, rotationRange: number, brightnessRange: number;
  if (args) {
    normalization = args.normalization;
    rotationRange = args.rotationRange;
    brightnessRange = args.brightnessRange;
  }
  const {trainData, validationData, testData, metaData} = data;
  assert.ok(metaData.feature, 'Image data should have feature');
  assert.ok(metaData.label && metaData.label.name, 'Image data should have label');
  assert.ok(trainData != null, 'The train data cannot be empty');
  const transformTrainData = trainData.mapAsync(async (processingData: any) => {
    return await processImage(processingData, rotationRange, brightnessRange, normalization, metaData);
  });

  const result: UniformTfSampleData = {
    trainData: transformTrainData,
    metaData: data.metaData
  };

  if (validationData) {
    const transformValidationData = validationData.mapAsync(async (processingData: any) => {
      return await processImage(processingData, rotationRange, brightnessRange, normalization, metaData);
    });
    result.validationData = transformValidationData;
  }
  if (testData) {
    const transformTestData = testData.mapAsync(async (processingData: any) => {
      return await processImage(processingData, rotationRange, brightnessRange, normalization, metaData);
    });
    result.testData = transformTestData;
  }

  return result;
}

export default imageClassDataProcess;