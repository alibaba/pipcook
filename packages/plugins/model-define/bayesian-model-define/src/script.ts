'use strict';

import fs from 'fs';
import readline from 'readline';

const boa = require('@pipcook/boa');

const jieba = boa.import('jieba');
const { MultinomialNB } = boa.import('sklearn.naive_bayes');
const pickle = boa.import('pickle');
const { open, list } = boa.builtins();

function strip(str: string): string {
  return str.replace(/(^\s*)|(\s*$)/g, '');
}

function isdigit(str: string): boolean {
  return /^\d+$/.test(str);
}

function MakeWordsSet(words_file: string): Promise<Set<string>> {
  const words_set = new Set<string>();
  const rl = readline.createInterface({
    input: fs.createReadStream(words_file)
  });
  return new Promise((resolve) => {
    rl.on('line', (line: string) => {
      const word = strip(line);
      if (word.length > 0 && !words_set.has(word)) {
        words_set.add(word);
      }
    });

    rl.on('close', () => {
      resolve(words_set);
    });
  });
}

function words_dict(all_words_list: string[], stopwords_set = new Set<string>()): string[] {
  const feature_words: string[] = [];
  for (let word of all_words_list) {
    if (!isdigit(word) &&
        !stopwords_set.has(word) &&
        word.length > 1 &&
        word.length < 5) {
      feature_words.push(word);
    }
  }

  return feature_words;
}

export const processPredictData = async function (data: any, all_words_list_path: string, stopwords_path: string): Promise<number[][]> {
  const all_words_list = pickle.load(open(all_words_list_path, 'rb'));
  const word_cut = jieba.cut(data, boa.kwargs({
    cut_all: false
  }));

  const stopwords_file = stopwords_path;
  const text_features = function (text: string, feature_words: string[]): number[] {
    const text_words = new Set(text);
    const features = [];
    for (let word of feature_words) {
      if (text_words.has(word)) {
        features.push(1);
      } else {
        features.push(0);
      }
    }

    return features;
  };

  const stopwords_set = await MakeWordsSet(stopwords_file);
  const feature_words = words_dict(all_words_list, stopwords_set);
  return [ text_features(list(word_cut), feature_words) ];
};

export const getBayesModel = function () {
  return MultinomialNB();
};

export const loadModel = function (filepath: string) {
  return pickle.load(open(filepath, 'rb'));
};
