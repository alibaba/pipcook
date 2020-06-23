import { join } from 'path';
import { ModelDefineType, CsvDataset, ModelDefineArgsType, TfJsLayersModel, CsvSample } from '@pipcook/pipcook-core';
import * as tf from '@tensorflow/tfjs-node-gpu';
const hanzi = require('hanzi-tools');

function charsToInput(chars: string, charSetArray: string[], maxParagraphLen: number) {
  const input = new Array(maxParagraphLen - 1).fill(0);
  let needTraditionalize = false;
  const newChars = Object.assign([], chars);

  for (let i = 0; i < chars.length; i++) {
    let charSetIdx = charSetArray.indexOf(chars[i]);
    if (charSetIdx < 0) {
      charSetIdx = charSetArray.indexOf(hanzi.traditionalize(chars[i]));
      if (charSetIdx < 0) {
        throw new Error(`Unkown character: ${chars[i]}`);
      } else {
        needTraditionalize = true;
      }
    }

    if (needTraditionalize) {
      newChars[i] = hanzi.traditionalize(chars[i]);
    }
    input[input.length - chars.length + i] = charSetArray.indexOf(chars[i]);
  }
  return input;
}

function oneHotToChar(onehot: number[], charSetArray: string[]): string {
  let maxIdx = 0;
  let maxValue = onehot[0];
  for (let i = 0; i < onehot.length; i++) {
    if (onehot[i] > maxValue) {
      maxValue = onehot[i];
      maxIdx = i;
    }
  }
  return charSetArray[maxIdx];
}

const lstmModel: ModelDefineType = async (data: CsvDataset, args: ModelDefineArgsType): Promise<TfJsLayersModel> => {
  const {
    recoverPath,
    loss = 'categoricalCrossentropy',
    optimizer = 'adam',
    metrics = [ 'accuracy' ]
  } = args;
  let { labelMap, maxLineLength } = args?.dataset || {};
  if (!recoverPath) {
    labelMap = data.metadata.labelMap;
    maxLineLength = data.metadata.maxLineLength;
  }
  console.info(`charset length is ${labelMap.length} and maxline length is ${maxLineLength}`);

  let model: tf.LayersModel = null;
  if (recoverPath) {
    model = (await tf.loadLayersModel('file://' + join(recoverPath, 'model.json'))) as tf.LayersModel;
  } else {
    const localModel = tf.sequential();
    localModel.add(tf.layers.embedding({
      inputDim: labelMap.length,
      outputDim: 100,
      inputLength: maxLineLength - 1
    }));
    localModel.add(tf.layers.bidirectional({
      layer: tf.layers.lstm({
        units: 150,
        returnSequences: true
      }) as tf.RNN
    }));
    localModel.add(tf.layers.dropout({
      rate: 0.2
    }));
    localModel.add(tf.layers.lstm({
      units: 100
    }));
    localModel.add(tf.layers.dense({
      units: Math.ceil(labelMap.length / 2),
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
    }));
    localModel.add(tf.layers.dense({
      units: labelMap.length,
      activation: 'softmax'
    }));
    model = localModel as tf.LayersModel;
  }

  model.compile({ loss, optimizer, metrics });
  model.summary();

  const result: TfJsLayersModel = {
    model,
    metrics,
    predict: async function (inputData: CsvSample) {
      let chars = inputData.data || '';
      const sentenceLength = 4;

      for (let j = 0; j < sentenceLength; j++) {
        for (let i = 1; i <= maxLineLength - 1; i++) {
          const inputs = charsToInput(chars, labelMap, maxLineLength);
          const [ value ] = this.model.predict(
            tf.tensor(inputs, [ 1, maxLineLength - 1 ])
          ).arraySync();
          const char = oneHotToChar(value, labelMap);
          chars += char;
          if (char === '。') {
            break;
          }
        }
      }
      return chars;
    }
  };
  return result;
};

export default lstmModel;
