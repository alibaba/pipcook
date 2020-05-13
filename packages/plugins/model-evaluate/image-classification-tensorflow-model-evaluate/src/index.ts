import { ImageDataset, ModelEvaluateType, UniModel, ModelTrainArgsType, ImageDataLoader, EvaluateResult } from '@pipcook/pipcook-core';

const boa = require('@pipcook/boa');
const { tuple } = boa.builtins();
const tf = boa.import('tensorflow');
const AUTOTUNE = tf.data.experimental.AUTOTUNE;

function loadImage(path: string) {
  let image = tf.io.read_file(path);
  image = tf.image.decode_jpeg(image, boa.kwargs({
    channels: 3
  }));
  return image;
}

async function createDataset(dataLoader: ImageDataLoader, labelMap: {
  [key: string]: number;
}) {
  const imageNames: string[] = [];
  const labels: number[] = [];
  const count = await dataLoader.len();
  for (let i = 0; i < count; i++) {
    const currentData = await dataLoader.getItem(i);
    imageNames.push(currentData.data);
    labels.push(tf.one_hot(currentData.label.categoryId, Object.keys(labelMap).length));
  }
  const pathDs = tf.data.Dataset.from_tensor_slices(imageNames);
  const imageDs = pathDs.map(loadImage, boa.kwargs({
    num_parallel_calls: AUTOTUNE
  }));
  const labelDs = tf.data.Dataset.from_tensor_slices(labels);
  const imageLabelDs = tf.data.Dataset.zip(tuple([ imageDs, labelDs ]));
  return imageLabelDs;
}

/**
 * this is plugin used to train tfjs model with pascal voc data format for image classification problem.
 * @param data : train data
 * @param model : model loaded before
 * @param epochs : need to specify epochs
 * @param batchSize : need to specify batch size
 * @param optimizer : need to specify optimizer
 */
const ModelEvaluate: ModelEvaluateType = async (data: ImageDataset, model: UniModel, args: ModelTrainArgsType): Promise<EvaluateResult> => {
  const {
    batchSize = 16
  } = args;

  const { testLoader, metadata } = data;

  if (testLoader) {
    let dataset = await createDataset(testLoader, metadata.labelMap);
    dataset = dataset.batch(batchSize);
    dataset = dataset.prefetch(boa.kwargs({
      buffer_size: AUTOTUNE
    }));
    const evaluateResult = model.model.evaluate(dataset);
    return evaluateResult.toString();
  }
  return {};
};

export default ModelEvaluate;
