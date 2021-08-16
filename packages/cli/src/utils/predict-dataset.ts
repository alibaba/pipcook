import { DatasetPool, DataCook } from '@pipcook/core';
import { PipelineType } from '@pipcook/costa';
/**
 * Data type for predict tasks
 */
export type PredictInput = string | Buffer;

export function makePredictDataset(inputs: Array<PredictInput>, pipelineType: PipelineType): DatasetPool.Types.DatasetPool<any, any> {
  let samples;
  if (pipelineType === PipelineType.ObjectDetection) {
    samples = inputs.map((input) => {
      if (typeof input === 'string') {
        return {
          data: {
            uri: input
          },
          label: undefined
        } as DataCook.Dataset.Types.ObjectDetection.Sample;
      } else {
        return {
          data: {
            buffer: input.buffer
          },
          label: undefined
        } as DataCook.Dataset.Types.ObjectDetection.Sample;
      }
    });

    const datasetData: DatasetPool.Types.DatasetData<DataCook.Dataset.Types.ObjectDetection.Sample> = {
      predictedData: samples
    };
    return DatasetPool.ArrayDatasetPoolImpl.from(datasetData, { type: DataCook.Dataset.Types.DatasetType.Image });
  } else if (pipelineType === PipelineType.ImageClassification) {
    samples = inputs.map((input) => {
      if (typeof input === 'string') {
        return {
          data: {
            uri: input
          },
          label: undefined
        } as DataCook.Dataset.Types.ImageClassification.Sample;
      } else {
        return {
          data: {
            buffer: input.buffer
          },
          label: undefined
        } as DataCook.Dataset.Types.ImageClassification.Sample;
      }
    });

    const datasetData: DatasetPool.Types.DatasetData<DataCook.Dataset.Types.ImageClassification.Sample> = {
      predictedData: samples
    };
    return DatasetPool.ArrayDatasetPoolImpl.from(datasetData, { type: DataCook.Dataset.Types.DatasetType.Image });
  } else if (pipelineType === PipelineType.TextClassification) {
    samples = inputs.map((input) => {
      if (typeof input === 'string') {
        return {
          data: input,
          label: undefined
        } as DataCook.Dataset.Types.TextClassification.Sample;
      } else {
        throw new TypeError('Should input text for text classification.');
      }
    });

    const datasetData: DatasetPool.Types.DatasetData<DataCook.Dataset.Types.TextClassification.Sample> = {
      predictedData: samples
    };
    return DatasetPool.ArrayDatasetPoolImpl.from(datasetData, { type: DataCook.Dataset.Types.DatasetType.Table });
  } else {
    return null;
  }
}
