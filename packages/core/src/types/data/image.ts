import { DataLoader, UniDataset, Metadata } from './common';

export interface SegmentationRLE {
  counts: string;
  size: number[]; 
}

export type SegmentationPolygon = number[][];

export interface ImageLabel {
  name: string;
  categoryId: number;
  bndbox?: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
  segmentation?: SegmentationPolygon | SegmentationRLE;
  iscrowd?: number;
}
export interface ImageMetadata extends Metadata {
  labelMap: Record<string, number>;
  isBitMask?: boolean;
}

export interface ImageSample {
  data: string;
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

export interface CocoDataset extends ImageDataset {
  trainAnnotationPath: string;
  validationAnnotationPath: string;
  testAnnotationPath: string;
}

export interface VocDataset extends ImageDataset {
  trainXmlPaths: string[];
  validationXmlPaths: string[];
  testXmlPaths: string[];
}
