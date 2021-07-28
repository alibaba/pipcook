import * as Datacook from '@pipcook/datacook';
import { PipelineType } from '@pipcook/costa';
/**
 * Data type for predict tasks
 */
export type PredictInput = string | Buffer;

export function makePredictDataset(input: PredictInput, pipelineType: PipelineType): Datacook.Dataset.Types.Dataset<any, any> {
  let samples;
  if (pipelineType === PipelineType.ObjectDetection) {
    if (typeof input === 'string') {
      samples = [{
        data: {
          uri: input
        },
        label: []
      } as Datacook.Dataset.Types.ObjectDetection.Sample];
    } else if (Buffer.isBuffer(input)) {
      samples = [{
        data: {
          buffer: input.buffer
        },
        label: []
      } as Datacook.Dataset.Types.ObjectDetection.Sample];
    }
  }
  const datasetData = {
    trainData: samples,
    testData: samples
  };
  return Datacook.Dataset.makeDataset(datasetData, { type: Datacook.Dataset.Types.DatasetType.Image });
}
