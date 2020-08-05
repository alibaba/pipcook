import imageDataProcess from '../../../packages/plugins/data-process/image-data-process/src/index';
import { ImageSample } from '../../../packages/cli/node_modules/@pipcook/pipcook-core';
import { makeImageSample, ASSET } from '../../utils/utils';
import path from 'path';
import Jimp from 'jimp';
import fs from 'fs-extra';

const imagePath = path.join(ASSET, "ImageSample", "mnistSample.png");
const copyImagePath = path.join(ASSET, "ImageSample", "mnistSample.png.copy");

describe("image data process", () => {
  beforeEach(async () => {
    await fs.copy(imagePath, copyImagePath);
  });

  it("resize default", async () => {
    const imageSample: ImageSample = makeImageSample(imagePath, "mnist", 0);

    await imageDataProcess(imageSample, {}, {});
    let image = await Jimp.read(imagePath);

    expect(image.getHeight()).toBe(256);
    expect(image.getWidth()).toBe(256);
  });

  it("resize to 224", async () => {
    const imageSample: ImageSample = makeImageSample(imagePath, "mnist", 0);

    await imageDataProcess(imageSample, {}, {resize: [224, 224]});
    let image = await Jimp.read(imagePath);

    expect(image.getHeight()).toBe(224);
    expect(image.getWidth()).toBe(224);
  });


  afterEach(async () => {
    await fs.remove(imagePath);
    await fs.rename(copyImagePath, imagePath);
  });

})
