import * as DataCook from '@pipcook/datacook';
import { DatasetPool } from '@pipcook/core';
import { PipelineType } from '@pipcook/costa';
/**
 * Data type for predict tasks
 */
export type PredictInput = string | Buffer;

export function makePredictDataset(input: PredictInput, pipelineType: PipelineType): DatasetPool.Types.DatasetPool<any, any> {
  let samples;
  if (pipelineType === PipelineType.ObjectDetection) {
    if (typeof input === 'string') {
      samples = [
        {
          data: {
            uri: input
          },
          label: []
        } as DataCook.Dataset.Types.ObjectDetection.Sample
      ];
    } else if (Buffer.isBuffer(input)) {
      samples = [
        {
          data: {
            buffer: input.buffer
          },
          label: []
        } as DataCook.Dataset.Types.ObjectDetection.Sample
      ];
    }

    const datasetData: DatasetPool.Types.DatasetData<DataCook.Dataset.Types.ObjectDetection.Sample> = {
      predictedData: samples
    };
    return DatasetPool.makeDatasetPool(datasetData, { type: DataCook.Dataset.Types.DatasetType.Image });
  } else {
    return null;
  }
}
