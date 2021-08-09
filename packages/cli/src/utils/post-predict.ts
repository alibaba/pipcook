import { PredictResult, DatasetPool } from '@pipcook/core';
import { PipelineType } from '@pipcook/costa';
import * as Jimp from 'jimp';
import { PredictInput } from './predict-dataset';
import * as path from 'path';
import { logger } from './';

export interface Options {
  type: PipelineType;
  inputs: Array<PredictInput>;
  [k: string]: any
}

export async function processData(predictResult: PredictResult, opts: Options): Promise<void> {
  logger.success(`Origin result:${JSON.stringify(predictResult)}`);
  switch (opts.type) {
  case PipelineType.ObjectDetection:
    await processObjectDetection(predictResult, opts);
    break;
  default:
    return;
  }
}

async function processObjectDetection(predictResult: DatasetPool.Types.ObjectDetection.PredictResult, opts: Options): Promise<void> {
  if (predictResult.length !== opts.inputs.length) {
    throw new TypeError('Size of predict result is not equal to inputs.');
  }
  for (let i = 0; i < opts.inputs.length; i++) {
    let img: Jimp;
    if (typeof opts.inputs[i] === 'string') {
      img = await Jimp.read(opts.inputs[i] as string);
    } else {
      img = await Jimp.read(opts.inputs[i] as Buffer);
    }
    const font = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
    predictResult[i].forEach((res: DatasetPool.Types.ObjectDetection.PredictObject) => {
      const x = Math.round(res.box[0] < 0 ? 0 : res.box[0]);
      const y = Math.round(res.box[1] < 0 ? 0 : res.box[1]);
      const w = Math.round(res.box[0] < 0 ? res.box[2] - Math.abs(res.box[0]) : res.box[2]);
      const h = Math.round(res.box[1] < 0 ? res.box[3] - Math.abs(res.box[1]) : res.box[3]);
      // draw class name and score
      img.print(font, x, y, `${res.category}:${res.score.toFixed(2)}`);
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
    await img.write(`${path.join(process.cwd(), `predict-result-${i}.png`)}`);
  }
  logger.success('Object detection result has been saved to:');
  for (let i = 0; i < opts.inputs.length; ++i) {
    logger.info(`predict-result-${i}.png`);
  }
}
