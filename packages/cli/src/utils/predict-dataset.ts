import * as DataCook from '@pipcook/datacook';
import { DatasetPool } from '@pipcook/core';
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
          label: []
        } as DataCook.Dataset.Types.ObjectDetection.Sample;
      } else {
        return {
          data: {
            buffer: input.buffer
          },
          label: []
        } as DataCook.Dataset.Types.ObjectDetection.Sample;
      }
    });

    const datasetData: DatasetPool.Types.DatasetData<DataCook.Dataset.Types.ObjectDetection.Sample> = {
      predictedData: samples
    };
    return DatasetPool.makeDatasetPool(datasetData, { type: DataCook.Dataset.Types.DatasetType.Image });
  } else {
    return null;
  }
}
