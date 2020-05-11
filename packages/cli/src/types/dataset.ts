interface DatasetMetadata {
  description: string;
  url: string;
  version: string;
  year: number;
  contributor: string;
  date_created: string;
}

export interface DatasetImage {
  license: number;
  file_name: string;
  coco_url: string;
  height: number;
  width: number;
  id: number;
}

interface DatasetLicense {
  url: string;
  id: number;
  name: string;
}

export interface DatasetAnnotation {
  id: number;
  image_id: number;
  category_id: number;
  segmentation: any[];
  iscrowd: number;
  area: string;
  bbox: string;
}

export interface DatasetCategory {
  id: number;
  name: string;
  supercategory: string;
}

export interface Dataset {
  info: DatasetMetadata;
  images: DatasetImage[];
  licenses: DatasetLicense[];
  annotations: DatasetAnnotation[];
  categories: DatasetCategory[];
}
