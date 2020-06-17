import { Image, VisionObject } from './types';
import { dynamicModelExports } from './executable';

/**
 * Classifies the image with given label, it returns the classification of this image.
 * @param img the input image type.
 */
export async function classify(img: Image): Promise<string> {
  throw new TypeError('not trained method');
}

/**
 * Generates an image by given trained images and labels.
 */
export async function generate(): Promise<Image> {
  throw new TypeError('not trained method');
}

/**
 * It detects kinds of objects with an array of `VisionObject`.
 * @param img the input image it contains objects.
 */
export async function detectObject(img: Image): Promise<VisionObject[]> {
  throw new TypeError('not trained method');
}

/**
 * It returns the segmentation of detected objects, it returns extra outline for each object.
 * @param img the input image it contains objects.
 */
export async function segmentObject(img: Image): Promise<VisionObject[]> {
  throw new TypeError('not trained method');
}

dynamicModelExports('nlp', module.exports);
