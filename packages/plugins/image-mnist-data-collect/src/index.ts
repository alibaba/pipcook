/**
 * @file For plugin to collect mnist data
 */
import {DataCollectType, OriginSampleData, ArgsType, createAnnotationFile, getDatasetDir} from '@pipcook/pipcook-core';
import * as tf from '@tensorflow/tfjs-node-gpu';
import Jimp from 'jimp';
import * as path from 'path';
const fs = require('fs-extra')
const _cliProgress = require('cli-progress');
const mnist = require('mnist');

/**
 * collect mnist data
 */
const imageMnistDataCollect: DataCollectType = async (args?: ArgsType): Promise<OriginSampleData> => {
  const {
    trainingCount = 8000,
    testCount = 500
  } = args || {};
  const savePath = getDatasetDir();
  const set = mnist.set(trainingCount, testCount);
  const trainingSet = set.training;
  const testSet = set.test;
  const bar1 = new _cliProgress.SingleBar({}, _cliProgress.Presets.shades_classic);
  console.log('collecting training data ...');
  bar1.start(trainingCount, 0);
  const saveDir = path.join(savePath, 'mnist');
  fs.removeSync(saveDir);
  for (let i = 0; i < trainingSet.length; i++) {
    bar1.update(i);
    const trainingSample = trainingSet[i];
    const input = (trainingSample.input).map((x: any) => x * 255);
    const output = trainingSample.output;
    const imageDir = path.join(saveDir, 'images');
    const annotationDir = path.join(saveDir, 'annotations', 'train');
    createAnnotationFile(annotationDir, `trainsample${i}.jpg`, imageDir, String(output.indexOf(1)))
    fs.ensureDirSync(imageDir);
    const image = await tf.node.encodeJpeg(tf.tensor3d(input, [ 28, 28, 1 ], 'int32'));
    const jimpImage = await Jimp.read(image.buffer as Buffer);
    await jimpImage.write(path.join(imageDir, `trainsample${i}.jpg`));
  }
  bar1.stop();

  console.log('collecting test data ...');
  const bar2 = new _cliProgress.SingleBar({}, _cliProgress.Presets.shades_classic);
  bar2.start(testCount, 0);
  for (let i = 0; i < testSet.length; i++) {
    bar2.update(i);
    const trainingSample = testSet[i];
    const input = (trainingSample.input).map((x: any) => x * 255);
    const output = trainingSample.output;
    const imageDir = path.join(saveDir, 'images');
    const annotationDir = path.join(saveDir, 'annotations', 'test');
    createAnnotationFile(annotationDir, `testsample${i}.jpg`, imageDir, String(output.indexOf(1)))
    fs.ensureDirSync(imageDir);
    const image = await tf.node.encodeJpeg(tf.tensor3d(input, [ 28, 28, 1 ], 'int32'));
    const jimpImage = await Jimp.read(image.buffer as Buffer);
    await jimpImage.write(path.join(imageDir, `testsample${i}.jpg`));
  }
  bar2.stop();


  const result: OriginSampleData = {
    trainDataPath: path.join(saveDir, 'annotations', 'train'),
    testDataPath: path.join(saveDir, 'annotations', 'test'),
  }
  
  return result;
}

export default imageMnistDataCollect;




