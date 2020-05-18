import { Context, controller, inject, provide, post } from 'midway';
import * as tf from '@tensorflow/tfjs-node-gpu';
import * as Jimp from 'jimp';
import axios from 'axios';

import { successRes } from '../../utils/response';

@provide()
@controller('/playground')
export class PlayGroundController {
  @inject()
  ctx: Context;

  @post('/mnist')
  public async mnist() {
    const { ctx } = this;
    const { image } = ctx.request.body;
    let img = await Jimp.read(Buffer.from(image.split(',')[1], 'base64'));
    img = img.resize(28, 28).invert().greyscale();
    const imageArray: number[] = [];
    await img.writeAsync('mnist.jpg');
    for (let i = 0; i < 28; i++) {
      for (let j = 0; j < 28; j++) {
        imageArray.push(Jimp.intToRGBA(img.getPixelColor(j, i)).r / 255);
      }
    }
    const newmodel = await tf.loadLayersModel('http://ai-sample.oss-cn-hangzhou.aliyuncs.com/pipcook/showcase/mnist/model.json');
    const result: any = newmodel.predict(tf.tensor4d(imageArray, [ 1, 28, 28, 1 ]));
    let number = -1;
    let prob = -1;
    const prediction = result.dataSync();
    for (const key in prediction) {
      if (prediction[key] > prob) {
        number = parseInt(key, 10);
        prob = prediction[key];
      }
    }
    successRes(ctx, {
      result: number,
    });
  }

  @post('/asset-classification')
  public async assetClassification() {
    const { ctx } = this;
    const { image } = ctx.request.body;
    let img = await Jimp.read(Buffer.from(image.split(',')[1], 'base64'));
    img = img.resize(256, 256);
    const imageArray: number[] = [];
    await img.writeAsync('imageclass.jpg');
    let meanJson = await axios.get('http://ai-sample.oss-cn-hangzhou.aliyuncs.com/pipcook/showcase/assetsClassification/mean.json');
    meanJson = meanJson.data;
    for (let i = 0; i < 256; i++) {
      for (let j = 0; j < 256; j++) {
        imageArray.push(Jimp.intToRGBA(img.getPixelColor(i, j)).r / 255 - meanJson[i][j][0]);
        imageArray.push(Jimp.intToRGBA(img.getPixelColor(i, j)).g / 255 - meanJson[i][j][1]);
        imageArray.push(Jimp.intToRGBA(img.getPixelColor(i, j)).b / 255 - meanJson[i][j][2]);
      }
    }
    const newmodel = await tf.loadGraphModel('http://ai-sample.oss-cn-hangzhou.aliyuncs.com/pipcook/showcase/assetsClassification/model.json');
    const result: any = newmodel.predict(tf.tensor4d(imageArray, [ 1, 256, 256, 3 ]));
    let number = -1;
    let prob = -1;
    const prediction = result.dataSync();
    for (const key in prediction) {
      if (prediction[key] > prob) {
        number = parseInt(key, 10);
        prob = prediction[key];
      }
    }
    const labels = [ 'avator', 'blurBackground', 'icon', 'label', 'brandLogo', 'itemImg', 'pureBackground', 'purePicture' ];
    successRes(ctx, {
      result: labels[number],
    });
  }
}
