import { DataLoader, UniDataset, MetaData } from './data';

export interface ImageLabel {
  name: string;
  categoryId: number;
  bndbox?: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
}
export interface ImageMetaData extends MetaData {
  labelMap: {[key: string]: number};
}

export interface ImageSample {
  data: string;
  label: ImageLabel;
}

export interface ImageDataLoader extends DataLoader {
  getItem: (id: number) => Promise<ImageSample>;
}

export interface ImageDataset extends UniDataset {
  metaData: ImageMetaData;
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
