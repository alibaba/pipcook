import { CsvDataset, ModelTrainType, TfJsLayersModel, ModelTrainArgsType, CsvDataLoader } from '@pipcook/pipcook-core';
import * as tf from '@tensorflow/tfjs-node-gpu';

async function createDataset(loader: CsvDataLoader, labelMap: string[]): Promise<tf.data.Dataset<tf.TensorContainer>> {
  const inputs = [] as tf.TensorContainer[];
  const len = await loader.len();
  const onehotLen = labelMap.length;
  for (let i = 0; i < len; i++) {
    const sample = await loader.getItem(i);
    inputs.push(tf.tidy(() => {
      return {
        xs: tf.tidy(() => sample.data),
        ys: tf.tidy(() => tf.oneHot(tf.scalar(sample.label, 'int32'), onehotLen))
      };
    }));
  }
  return tf.data.array(inputs);
}

const ModelTrain: ModelTrainType = async (dataset: CsvDataset, model: TfJsLayersModel, args: ModelTrainArgsType): Promise<TfJsLayersModel> => {
  const {
    epochs = 200,
    batchSize = 16,
    modelPath
  } = args;

  const { trainLoader, metadata } = dataset;
  const count = await trainLoader.len();
  const trainConfig: any = {
    epochs: epochs,
    batchesPerEpoch: Math.floor(count / batchSize)
  };

  const trainDataset = await createDataset(trainLoader, metadata.labelMap as unknown as string[]);
  console.info('created train dataset', trainDataset);

  const trainModel = model.model;
  await trainModel.fitDataset(trainDataset.repeat().batch(batchSize), trainConfig);
  await trainModel.save(`file://${modelPath}`);

  const result: TfJsLayersModel = {
    ...model,
    model: trainModel
  };
  return result;
};

export default ModelTrain;
