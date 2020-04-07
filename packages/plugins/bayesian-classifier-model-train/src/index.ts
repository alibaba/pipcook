/**
 * @file this is for Pipcook plugin to train Bayes Classifier.
 */
import { ModelTrainType, PipcookModel, UniformTfSampleData, MetaData, ArgsType, getModelDir } from '@pipcook/pipcook-core';
import * as tf from '@tensorflow/tfjs-node-gpu';
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import { Python } from '@pipcook/pipcook-python-node';

/**
 * assertion test
 * @param data 
 */
const assertionTest = (data: UniformTfSampleData, trainData: tf.data.Dataset<{ xs: tf.Tensor<any>; ys?: tf.Tensor<any> }>, metaData: MetaData) => {
  assert.ok(data.metaData.feature && data.metaData.feature.shape 
    && data.metaData.feature.shape.length === 1, 'feature should only have one dimension which is the feature name');
  assert.ok(data.metaData.label && data.metaData.label.shape 
    && data.metaData.label.shape.length === 1, 'Label should only have one dimension which is the label name');
  assert.ok(metaData.feature && metaData.label.name, 'data should have feature');
  assert.ok(metaData.label && metaData.label.name, 'data should have label');
  assert.ok(trainData != null, 'The train data cannot be empty');
};

/**
 * 
 * @param data Pipcook uniform data 
 * @param model Eshcer model
 */
const bayesianClassifierModelTrain: ModelTrainType = async (data: UniformTfSampleData, model: PipcookModel, args?: ArgsType): Promise<PipcookModel> => {
  const { pipelineId } = args || {};
  const { trainData, metaData } = data;
  assertionTest(data, trainData, metaData);
  
  const classifier = model.model;
  const { mode } = model.extraParams;
  
  const rawData: any[] = [];
  const rawClass: any[] = [];
  await trainData.forEachAsync((e: any) => {
    rawData.push(e[metaData.feature.name].dataSync()[0]);
    rawClass.push(e[metaData.label.name].dataSync()[0]);
  });

  let text_list;
  let feature_list;
  let feature_words: any;

  await Python.scope('bayes_text_classification', async (python: any) => {
    const _ = python.nA;
    const TextProcessing = python.runRaw('TextProcessing');
    const MakeWordsSet = python.runRaw('MakeWordsSet');
    const words_dict = python.runRaw('words_dict');
    const TextFeatures = python.runRaw('TextFeatures');

    text_list = TextProcessing(rawData, rawClass, _({ test_size: 0.2 }));
    let stopwords_file: any;
    let stoppath = '';
    if (mode === 'en') {
      stoppath = path.join(__dirname, 'assets', 'stopwords_en.txt');
    } else {
      stoppath = path.join(__dirname, 'assets', 'stopwords_cn.txt');
    }
    stopwords_file = python.createString(stoppath);
    fs.copyFileSync(stoppath, path.join(getModelDir(pipelineId), 'stopwords.txt'));
    const stopwords_set = MakeWordsSet(stopwords_file);
    feature_words = words_dict(text_list[0], stopwords_set);
    feature_list = TextFeatures(text_list[1], text_list[2], feature_words);
    classifier.fit(feature_list[0], text_list[3]);
  });

  return {
    ...model,
    model: classifier,
    extraParams: {
      feature_list,
      text_list
    },
    save: async function(modelPath: string) {
      await Python.scope('bayes_text_classification', async (python: any) => {
        const saveModel = python.runRaw('saveModel');
        saveModel(this.model, path.join(modelPath, 'model.pkl'));
        const save_all_words_list = python.runRaw('save_all_words_list');
        save_all_words_list(feature_words, path.join(modelPath, 'feature_words.pkl'));
      });
    }
  };
};

export default bayesianClassifierModelTrain;

