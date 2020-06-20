import { ModelDefineType, CsvDataset, ModelDefineArgsType, TfJsLayersModel, CsvSample } from '@pipcook/pipcook-core';
import * as tf from '@tensorflow/tfjs-node-gpu';

const lstmModel: ModelDefineType = async (data: CsvDataset, args: ModelDefineArgsType): Promise<TfJsLayersModel> => {
  const { recoverPath } = args;
  const { labelMap, maxLineLength } = data.metadata;
  console.info(`charset length is ${labelMap.length} and maxline length is ${maxLineLength}`);

  const model = tf.sequential();
  model.add(tf.layers.embedding({
    inputDim: labelMap.length,
    outputDim: 100,
    inputLength: maxLineLength - 1
  }));
  model.add(tf.layers.bidirectional({
    layer: tf.layers.lstm({
      units: 150,
      returnSequences: true
    }) as tf.RNN
  }));
  model.add(tf.layers.dropout({
    rate: 0.2
  }));
  model.add(tf.layers.lstm({
    units: 100
  }));
  model.add(tf.layers.dense({
    units: Math.ceil(labelMap.length / 2),
    activation: 'relu',
    kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
  }));
  model.add(tf.layers.dense({
    units: labelMap.length,
    activation: 'softmax'
  }));
  model.compile({
    loss: 'categoricalCrossentropy',
    optimizer: 'adam',
    metrics: [ 'accuracy' ]
  });
  model.summary();

  const result: TfJsLayersModel = {
    model,
    metrics: [ 'accuracy' ],
    predict: async function (inputData: CsvSample) {
      // TODO
    }
  };
  return result;
};

export default lstmModel;
