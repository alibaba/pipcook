import { PredictResult, DatasetPool } from '@pipcook/core';
import { PipelineType } from '@pipcook/costa';
import * as Jimp from 'jimp';
import { PredictInput } from './predict-dataset';
import * as path from 'path';
import { logger } from './';

export interface Options {
  type: PipelineType;
  input: PredictInput;
  [k: string]: any
}

export async function processData(predictResult: PredictResult, opts: Options): Promise<void> {
  switch (opts.type) {
  case PipelineType.ObjectDetection:
    await processObjectDetection(predictResult, opts);
    break;
  default:
    return;
  }
}

async function processObjectDetection(predictResult: DatasetPool.Types.ObjectDetection.PredictResult, opts: Options): Promise<void> {
  let img: Jimp;
  if (typeof opts.input === 'string') {
    img = await Jimp.read(opts.input);
  } else {
    img = await Jimp.read(opts.input as Buffer);
  }
  const font = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
  predictResult.forEach((res: DatasetPool.Types.ObjectDetection.SinglePredictResult) => {
    const x = Math.round(res.box[0] < 0 ? 0 : res.box[0]);
    const y = Math.round(res.box[1] < 0 ? 0 : res.box[1]);
    const w = Math.round(res.box[0] < 0 ? res.box[2] - Math.abs(res.box[0]) : res.box[2]);
    const h = Math.round(res.box[1] < 0 ? res.box[3] - Math.abs(res.box[1]) : res.box[3]);
    // draw class name and score
    img.print(font, x, y, `${res.class}:${res.score.toFixed(2)}`);
    // draw box
    for (let drawX = x; drawX <= x + w; ++drawX) {
      img.setPixelColor(0xFF, drawX, y);
      img.setPixelColor(0xFF, drawX, y + h);
    }
    for (let drawY = y; drawY <= y + h; ++drawY) {
      img.setPixelColor(0xFF, x, drawY);
      img.setPixelColor(0xFF, x + w, drawY);
    }
  });
  await img.write(`${path.join(process.cwd(), 'tmp.png')}`);
  logger.success('Object detection result has saved to tmp.png');
}
