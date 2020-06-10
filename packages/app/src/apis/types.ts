/**
 * The image type. 
 */
export class Image {
  /**
   * The image height
   */
  height: number;
  /**
   * the image width
   */
  width: number;
  /**
   * the pixels for the image.
   */
  pixels: Buffer;
}

/**
 * The vision object is used by object detection and segmentation.
 */
export interface VisionObject {
  label: string;
  position2d?: Position2D;
  outline?: Image;
}

/**
 * The 2d position to represent the object.
 */
export interface Position2D {
  x: number;
  y: number;
}

/**
 * The named entity.
 */
export interface NamedEntity {
  // TODO
}

/**
 * The named entity props.
 */
export interface NamedEntityProp {
  sentence: string;
  entities: NamedEntity[];
}

/**
 * The text-based answer for a given question.
 */
export interface TextAnswer {
  answer: string;
  confidence: number;
}

/**
 * The translation result.
 */
export interface TranslationResult {
  lang: string;
  output: string;
}
