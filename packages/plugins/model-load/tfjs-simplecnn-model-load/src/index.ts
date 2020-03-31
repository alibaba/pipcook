import {ModelLoadType, getModelDir, ImageDataset, ModelLoadArgsType, TfJsLayersModel} from '@pipcook/pipcook-core';
import * as tf from '@tensorflow/tfjs-node-gpu';
import * as assert from 'assert';
import * as path from 'path';

/** @ignore
 * assertion test
 * @param data 
 */
const assertionTest = (data: ImageDataset) => {
  assert.ok(data.metaData.feature, 'Image feature is missing');
  assert.ok(data.metaData.feature.shape.length === 3, 'The size of an image must be 3d');
}

/**
 * this is the plugin used to load a simple cnn model or load existing model.
 * @param optimizer (string | tf.train.Optimizer)[optional / default = tf.train.rmsprop(0.00005, 1e-7)] the optimizer of model
 * @param loss (string | string [] | {[outputName: string]: string} | LossOrMetricFn | LossOrMetricFn [] | {[outputName: string]: LossOrMetricFn}) \
 * [optional / default = 'categoricalCrossentropy'] the loss function of model
 * @param metrics (string | LossOrMetricFn | Array | {[outputName: string]: string | LossOrMetricFn}): [optional / default = ['accuracy']] \
 * the evaluation metrics of model during training
 * @param modelId (string)[optional] if you want to load a model from previously trained pipcook pipeline, give the pipeline id here
 * @param modelPath (string)[optional] if you want to load a model from a local file path, give the path here
 */
const simpleCnnModelLoad: ModelLoadType = async (data: ImageDataset, args: ModelLoadArgsType): Promise<TfJsLayersModel> => {
  let {
    optimizer = tf.train.rmsprop(0.00005, 1e-7),
    loss = 'categoricalCrossentropy',
    metrics = ['accuracy'],
    modelId,
    modelPath,
    outputShape
  } = args;
  
  let inputShape: number[];

  // create a new model
  if (!modelId && !modelPath) {
    assertionTest(data);
    inputShape = data.metaData.feature.shape;
    outputShape = Object.keys(data.metaData.labelMap).length;
  }
  
  let model: tf.LayersModel | null = null;
  // load from former pipcook trained model
  if (modelId) {
    model = (await tf.loadLayersModel('file://' + path.join(getModelDir(modelId), 'model.json'))) as tf.LayersModel;
  } else if (modelPath) {
    model = (await tf.loadLayersModel(modelPath) as tf.LayersModel);
  } else {
    const localModel = tf.sequential();
    localModel.add(tf.layers.conv2d({
      inputShape: inputShape,
      filters: 32,
      kernelSize: 3,
      activation: 'relu',
      kernelInitializer: 'glorotUniform',
      padding: 'same'
    }));
    localModel.add(tf.layers.conv2d({
      filters: 32,
      kernelSize: 3,
      activation: 'relu',
      kernelInitializer: 'glorotUniform',
    }));
    localModel.add(tf.layers.maxPooling2d({poolSize: [2, 2]}));
    localModel.add(tf.layers.dropout({rate: 0.25}));
    localModel.add(tf.layers.conv2d({
      filters: 64,
      kernelSize: 3,
      activation: 'relu',
      kernelInitializer: 'glorotUniform',
      padding: 'same'
    }));
    localModel.add(tf.layers.conv2d({
      filters: 64,
      kernelSize: 3,
      activation: 'relu',
      kernelInitializer: 'glorotUniform'
    }));
    localModel.add(tf.layers.maxPooling2d({poolSize: [2, 2]}));
    localModel.add(tf.layers.dropout({rate: 0.25}));
    localModel.add(tf.layers.flatten());
    localModel.add(tf.layers.dense({units: 512, activation: 'relu', kernelInitializer: 'glorotUniform'}));
    localModel.add(tf.layers.dropout({rate: 0.5}));
    localModel.add(tf.layers.dense({units: outputShape, activation: 'softmax', kernelInitializer: 'glorotUniform'}));

    model = localModel as tf.LayersModel;
  }

  model.compile({
    optimizer,
    loss,
    metrics,
  });
  
  const result: TfJsLayersModel = {
    model,
    metrics: metrics,
    predict: function (inputData: tf.Tensor<any>) {
      const predictResultArray = this.model.predict(inputData)
      return predictResultArray;
    },
  };
  return result;
}

export default simpleCnnModelLoad;