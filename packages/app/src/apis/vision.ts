import { Image, Position2D } from './types';

export async function classify(img: Image): Promise<string> {
  return '';
}

export async function generate(): Promise<Image> {
  return new Image();
}

export async function detectObject(img: Image): Promise<Position2D> {
  return { x: 0, y: 0 };
}

export async function segmentObject(img: Image): Promise<Image> {
  return new Image();
}
