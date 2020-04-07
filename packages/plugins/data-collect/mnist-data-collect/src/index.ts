/**
 * @file For plugin to collect mnist data
 */
<<<<<<< HEAD:packages/plugins/data-collect/mnist-data-collect/src/index.ts
import {DataCollectType, ArgsType, createAnnotationFile} from '@pipcook/pipcook-core';
import * as tf from '@tensorflow/tfjs-node-gpu';
import Jimp from 'jimp';
import * as path from 'path';
import _cliProgress from 'cli-progress';

=======
import { DataCollectType, OriginSampleData, ArgsType, createAnnotationFile, getDatasetDir } from '@pipcook/pipcook-core';
import * as tf from '@tensorflow/tfjs-node-gpu';
import Jimp from 'jimp';
import * as path from 'path';
const fs = require('fs-extra');
const _cliProgress = require('cli-progress');
>>>>>>> c29f0545a3818b450befb81c97eec238b53f8a84:packages/plugins/image-mnist-data-collect/src/index.ts
const mnist = require('mnist');

/**
 * collect mnist data
 */
const imageMnistDataCollect: DataCollectType = async (args: ArgsType): Promise<void> => {
  const {
    trainCount = 8000,
    testCount = 500,
    dataDir
  } = args;

  const set = mnist.set(trainCount, testCount);
  const trainingSet = set.training;
  const testSet = set.test;

  const bar1 = new _cliProgress.SingleBar({}, _cliProgress.Presets.shades_classic);
  console.log('collecting training data ...');
  bar1.start(trainCount, 0);

  for (let i = 0; i < trainingSet.length; i++) {
    bar1.update(i);
    const trainingSample = trainingSet[i];
    const input = (trainingSample.input).map((x: any) => x * 255);
    const output = trainingSample.output;
<<<<<<< HEAD:packages/plugins/data-collect/mnist-data-collect/src/index.ts
    const trainDir = path.join(dataDir, 'train');
    const imageName = `trainsample${i}.jpg`;
    createAnnotationFile(trainDir, imageName, trainDir, String(output.indexOf(1)));
    const image = await tf.node.encodeJpeg(tf.tensor3d(input, [28, 28, 1], 'int32'));
=======
    const imageDir = path.join(saveDir, 'images');
    const annotationDir = path.join(saveDir, 'annotations', 'train');
    createAnnotationFile(annotationDir, `trainsample${i}.jpg`, imageDir, String(output.indexOf(1)));
    fs.ensureDirSync(imageDir);
    const image = await tf.node.encodeJpeg(tf.tensor3d(input, [ 28, 28, 1 ], 'int32'));
>>>>>>> c29f0545a3818b450befb81c97eec238b53f8a84:packages/plugins/image-mnist-data-collect/src/index.ts
    const jimpImage = await Jimp.read(image.buffer as Buffer);
    await jimpImage.write(path.join(trainDir, imageName));
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
<<<<<<< HEAD:packages/plugins/data-collect/mnist-data-collect/src/index.ts
    const testDir = path.join(dataDir, 'test');
    const imageName = `trainsample${i}.jpg`;
    createAnnotationFile(testDir, imageName, testDir, String(output.indexOf(1)))
    const image = await tf.node.encodeJpeg(tf.tensor3d(input, [28, 28, 1], 'int32'));
=======
    const imageDir = path.join(saveDir, 'images');
    const annotationDir = path.join(saveDir, 'annotations', 'test');
    createAnnotationFile(annotationDir, `testsample${i}.jpg`, imageDir, String(output.indexOf(1)));
    fs.ensureDirSync(imageDir);
    const image = await tf.node.encodeJpeg(tf.tensor3d(input, [ 28, 28, 1 ], 'int32'));
>>>>>>> c29f0545a3818b450befb81c97eec238b53f8a84:packages/plugins/image-mnist-data-collect/src/index.ts
    const jimpImage = await Jimp.read(image.buffer as Buffer);
    await jimpImage.write(path.join(testDir, imageName));
  }
  bar2.stop();
<<<<<<< HEAD:packages/plugins/data-collect/mnist-data-collect/src/index.ts
}
=======


  const result: OriginSampleData = {
    trainDataPath: path.join(saveDir, 'annotations', 'train'),
    testDataPath: path.join(saveDir, 'annotations', 'test')
  };
  
  return result;
};
>>>>>>> c29f0545a3818b450befb81c97eec238b53f8a84:packages/plugins/image-mnist-data-collect/src/index.ts

export default imageMnistDataCollect;
