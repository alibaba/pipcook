import {MetaData, Statistic} from './other';

export interface UniformSampleData {
  trainData: string;
  validationData?: string;
  testData?: string;
  metaData?: MetaData;
  dataStatistics?: Statistic[];
  validationResult?: {
    result: boolean;
    message: string;
  };
}

export interface PascolVocSampleData extends UniformSampleData {
}

export interface CocoSampleData extends UniformSampleData {

}

export interface CsvSampleData extends UniformSampleData {

}

export interface InsertParams {
  pipelineId: string;
  modelDir: string;
  dataDir: string;
}