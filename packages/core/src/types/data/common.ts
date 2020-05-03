import { Statistic } from '../other';

export interface DataDescriptor {
  type?: any;
  shape?: number[];
  names?: string[];
}

export interface Metadata {
  feature?: DataDescriptor;
  label?: DataDescriptor;
  labelMap?: Record<string, number>;
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
  metadata?: Metadata;
  dataStatistics: Statistic[];
  validationResult: {
    result: boolean;
    message?: string;
  };
  trainLoader?: DataLoader;
  validationLoader?: DataLoader;
  testLoader?: DataLoader;
}
