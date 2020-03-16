/**
 * @file This is for the plugin to load Bayes Classifier model.
 */

import {ModelLoadType, PipcookModel, ModelLoadArgsType, getModelDir, UniformTfSampleData} from '@pipcook/pipcook-core';
import * as tf from '@tensorflow/tfjs-node-gpu';
import * as assert from 'assert';
import {Python} from '@pipcook/pipcook-python-node';
import * as path from 'path';
/**
 * assertion test
 * @param data 
 */
const assertionTest = (data: UniformTfSampleData) => {
  assert.ok(data.metaData.feature && data.metaData.feature.shape 
    && data.metaData.feature.shape.length === 1, 'feature should only have one dimension which is the feature name');
  assert.ok(data.metaData.label && data.metaData.label.shape 
    && data.metaData.label.shape.length === 1, 'Label should only have one dimension which is the label name');
}

/**
 * Pipcook Plugin: bayes classifier model
 * @param data Pipcook uniform sample data
 * @param args args. If the model path is provided, it will restore the model previously saved
 */
const bayesianClassifierModelLoad: ModelLoadType = async (data: UniformTfSampleData, args?: ModelLoadArgsType): Promise<PipcookModel> => {
  const {
    modelId='',
    mode='cn',
    pipelineId
  } = args || {} as ModelLoadArgsType;
  
  if (!modelId) {
    assertionTest(data);
  }

  let classifier: any;

  await Python.scope('bayes_text_classification', async (python: any) => {
    python.install('jieba', {
      source: 'https://pypi.tuna.tsinghua.edu.cn/simple'
    });
    python.install('sklearn', {
      source: 'https://pypi.tuna.tsinghua.edu.cn/simple'
    });
    python.install('numpy', {
      source: 'https://pypi.tuna.tsinghua.edu.cn/simple'
    });

    await python.reconnect();
    python.executePythonFile(path.join(__dirname, 'assets', 'script.py'));
    const loadModel = python.runRaw('loadModel')
    const getBayesModel = python.runRaw('getBayesModel')
    if (modelId) {
      classifier = loadModel(path.join(getModelDir(modelId), 'model.pkl'));
    } else {
      classifier = getBayesModel();
    }
  });


  const result: PipcookModel = {
    model: classifier,
    type: 'text classification',
    inputShape: [1],
    inputType: 'string',
    outputShape: [1],
    outputType: 'string',
    extraParams: {
      mode
    },
    save: async function(modelPath: string) {
      await Python.scope('bayes_text_classification', async (python: any) => {
        const saveModel = python.runRaw('saveModel')
        saveModel(this.model, path.join(modelPath, 'model.pkl'))
      });
    },
    predict: async function(data: tf.Tensor<any>) {
      const predictData = data.dataSync()[0];
      let prediction: any;
      await Python.scope('bayes_text_classification', async (python: any) => {
        const processPredictData = python.runRaw('processPredictData');
        const processData = processPredictData(predictData, path.join(getModelDir(pipelineId), 'feature_words.pkl'), path.join(getModelDir(pipelineId), 'stopwords.txt'))
        prediction = this.model.predict(processData)
        prediction = await python.evaluate(prediction);
      });
      return prediction;
    }, 
  }
  return result;
}

export default bayesianClassifierModelLoad;