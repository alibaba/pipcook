import * as DataCook from '@pipcook/datacook';
import * as Papaparse from 'papaparse';
import { makeDatasetPool, Types } from '..';
import Csv = DataCook.Dataset.Types.Csv;

export interface Options {
  trainData?: string;
  testData?: string;
  validData?: string;
  predictedData?: string;
  hasHeader: boolean;
  delimiter?: string;
  labels?: string[];
}

function toSamples(
  parsedData: Papaparse.ParseResult<Record<string, string>>,
  labelFields?: Array<string>
): Array<Csv.Sample> {
  return parsedData.data.map((data) => {
    const label: Record<string, string> = {};
    const newData = { ...data };
    labelFields?.forEach((field) => {
      label[field] = newData[field];
      delete newData[field];
    });
    return {
      data: newData,
      label
    };
  });
}

export const makeDatasetPoolFromCsv = (options: Options): Types.DatasetPool<Csv.Sample, Types.Csv.DatasetMeta> => {
  const config = {
    header: options.hasHeader, delimiter: options.delimiter
  };
  const parsedTrainData = options.trainData ? Papaparse.parse<Record<string, string>>(options.trainData, config) : undefined;
  const parsedTestData = options.testData ? Papaparse.parse<Record<string, string>>(options.testData, config) : undefined;
  const parsedValidData = options.validData ? Papaparse.parse<Record<string, string>>(options.validData, config) : undefined;
  const parsedPredictedData = options.predictedData ? Papaparse.parse<Record<string, string>>(options.predictedData, config) : undefined;
  const data = {
    trainData: parsedTrainData ? toSamples(parsedTrainData, options.labels) : undefined,
    testData: parsedTestData ? toSamples(parsedTestData, options.labels) : undefined,
    validData: parsedValidData ? toSamples(parsedValidData, options.labels) : undefined,
    predictedData: parsedPredictedData ? toSamples(parsedPredictedData, options.labels) : undefined
  };
  const meta: Types.Csv.DatasetMeta = {
    type: DataCook.Dataset.Types.DatasetType.Table,
    size: {
      train: data.trainData?.length || 0,
      test: data.testData?.length || 0,
      valid: data.validData?.length || 0,
      predicted: data.predictedData?.length || 0
    }
  };
  return makeDatasetPool(data, meta);
};
