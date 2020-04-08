import { Statistic } from '../other';

export interface DataDescriptor {
  type?: any;
  shape?: number[];
  featureNames?: string[];
}

export interface MetaData {
  feature?: DataDescriptor;
  label?: DataDescriptor;
  labelMap?: {[key: string]: number};
}

export interface Sample {
  data: any;
  label: any;
}

export interface DataLoader {
  len: () => Promise<number>;
  getItem: (id: number) => Promise<Sample>;
}

export interface UniDataset {
  metaData?: MetaData;
  dataStatistics: Statistic[];
  validationResult: {
    result: boolean;
    message?: string;
  };
  trainLoader?: DataLoader;
  validationLoader?: DataLoader;
  testLoader?: DataLoader;
}
