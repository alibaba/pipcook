import { DataLoader, UniDataset, Metadata } from './common';

export interface SegmentationRLE {
  counts: string;
  size: number[];
}

export type SegmentationPolygon = number[][];

/**
 * label for image type task.
 */
export interface ImageLabel {
  /**
   * the label name.
   */
  name: string;
  /**
   * the id for category.
   */
  categoryId: number;
  /**
   * the position for an object, used by object detection.
   */
  bndbox?: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
  /**
   * the segmentation representation, used by image segementation.
   */
  segmentation?: SegmentationPolygon | SegmentationRLE;
  iscrowd?: number;
}

/**
 * The metadata for image type task.
 */
export interface ImageMetadata extends Metadata {
  labelMap: Record<string, number>;
  isBitMask?: boolean;
}

/**
 * The sample for image.
 */
export interface ImageSample {
  /**
   * TODO(yorkie): support buffer or stream?
   * The pathname for the image.
   */
  data: string;
  /**
   * The label for this image.
   */
  label: ImageLabel;
}

export interface ImageDataLoader extends DataLoader {
  getItem: (id: number) => Promise<ImageSample>;
}

export interface ImageDataset extends UniDataset {
  metadata: ImageMetadata;
  trainLoader?: ImageDataLoader;
  validationLoader?: ImageDataLoader;
  testLoader?: ImageDataLoader;
}

/**
 * The dataset for storing coco dataset.
 */
export interface CocoDataset extends ImageDataset {
  /**
   * Provides coco annotation files for train/valid/test.
   */
  trainAnnotationPath: string;
  validationAnnotationPath: string;
  testAnnotationPath: string;
}

/**
 * The dataset for storing PascalVoc format.
 */
export interface VocDataset extends ImageDataset {
  /**
   * Provides XML files for train/valid/test.
   */
  trainXmlPaths: string[];
  validationXmlPaths: string[];
  testXmlPaths: string[];
}
