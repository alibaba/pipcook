/**
 * @file This plugin is used to load the mobileNet for image classification. The input layer is modified to fit into any shape of input.
 * The final layer is changed to a softmax layer to match the output shape
 */

import { ModelDefineType, ImageDataset, ImageSample, ModelDefineArgsType, UniModel, download, constants } from '@pipcook/pipcook-core';
import * as assert from 'assert';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

const boa = require('@pipcook/boa');
const tf = boa.import('tensorflow');
const { Adam } = boa.import('tensorflow.keras.optimizers');
const { MobileNetV2 } = boa.import('tensorflow.keras.applications');
const { GlobalAveragePooling2D, Dropout, Dense } = boa.import('tensorflow.keras.layers');
const { Model } = boa.import('tensorflow.keras.models');


const MODEL_WEIGHTS_NAME = 'mobilenet_v2_weights_tf_dim_ordering_tf_kernels_1.0_224_no_top.h5';
const MODEL_URL =
  `http://ai-sample.oss-cn-hangzhou.aliyuncs.com/pipcook/models/mobilenet_python/${MODEL_WEIGHTS_NAME}`;
const MODEL_PATH = path.join(constants.KERAS_DIR, 'models', MODEL_WEIGHTS_NAME);

/** @ignore
 * assertion test
 * @param data
 */
const assertionTest = (data: ImageDataset) => {
  assert.ok(data.metadata.feature, 'Image feature is missing');
  assert.ok(data.metadata.feature.shape.length === 3, 'The size of an image must be 3d');
};

/**
 *  main function of the operator: load the mobilenet model
 * @param data sample data
 */
const mobilenetDefine: ModelDefineType = async (data: ImageDataset, args: ModelDefineArgsType): Promise<UniModel> => {
  let {
    loss = 'categorical_crossentropy',
    metrics = [ 'accuracy' ],
    learningRate = 0.001,
    decay = 0.05,
    recoverPath,
    labelMap,
    freeze = false
  } = args;

  let inputShape: number[];
  let outputShape: number;

  if (!recoverPath) {
    assertionTest(data);
    inputShape = data.metadata.feature.shape;
    outputShape = Object.keys(data.metadata.labelMap).length;
    labelMap = data.metadata.labelMap;
  } else {
    const logContent = await fs.readFile(path.join(recoverPath, '..', 'metadata.json'), 'utf8');
    const log = JSON.parse(logContent);
    labelMap = JSON.parse(log.output.dataset).labelMap;
    outputShape = Object.keys(labelMap).length;
  }

  let model: any;

  if (!await fs.pathExists(MODEL_PATH)) {
    await download(MODEL_URL, MODEL_PATH);
  }

  model = MobileNetV2(boa.kwargs({
    include_top: false,
    weights: 'imagenet',
    input_shape: inputShape
  }));

  let output = model.output;
  output = GlobalAveragePooling2D()(output);
  output = Dense(1024, boa.kwargs({
    activation: 'relu'
  }))(output);
  output = Dropout(0.5)(output);

  const outputs = Dense(outputShape, boa.kwargs({
    activation: 'softmax'
  }))(output);
  model = Model(boa.kwargs({
    inputs: model.input,
    outputs: outputs
  }));

  if (freeze) {
    for (let layer of model.layers.slice(0, -10)) {
      layer.trainable = false;
    }
  }

  if (recoverPath) {
    model.load_weights(path.join(recoverPath, 'weights.h5'));
  }

  model.compile(boa.kwargs({
    optimizer: Adam(boa.kwargs({
      lr: learningRate,
      decay
    })),
    loss: loss,
    metrics: metrics
  }));

  const result: UniModel = {
    model,
    metrics: metrics,
    predict: async function (inputData: ImageSample) {
      let image = tf.io.read_file(inputData.data);
      image = tf.image.decode_jpeg(image, boa.kwargs({
        channels: 3
      }));
      const shape = tf.shape(image).numpy();
      return this.model.predict(tf.reshape(image, [1, shape[0], shape[1], shape[2]])).toString();
    }
  };
  return result;
};

export default mobilenetDefine;
