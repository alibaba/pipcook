interface DataSetJSONInfo {
  description: string;
  url: string;
  version: string;
  year: number;
  contributor: string;
  date_created: string;
}

export interface DataSetJSONImage {
  license: number;
  file_name: string;
  coco_url: string;
  height: number;
  width: number;
  id: number;
}

interface DataSetJSONLicense {
  url: string;
  id: number;
  name: string;
}

export interface DataSetJSONAnnotation {
  id: number;
  image_id: number;
  category_id: number;
  segmentation: any[];
  iscrowd: number;
  area: string;
  bbox: string;
}

export interface DataSetJSONCategory {
  id: number;
  name: string;
  supercategory: string;
}

export interface DataSetJSON {
  info: DataSetJSONInfo;
  images: DataSetJSONImage[];
  licenses: DataSetJSONLicense[];
  annotations: DataSetJSONAnnotation[];
  categories: DataSetJSONCategory[];
}

export interface CategoryMap {
  [categoryName: string]: number;
}
