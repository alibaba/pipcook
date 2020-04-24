'use strict';

import fs from 'fs';
import readline from 'readline';
import { zip, unzip } from 'lodash';

const boa = require('@pipcook/boa');

const jieba = boa.import('jieba');
const random = boa.import('random');
const pickle = boa.import('pickle');
const { MultinomialNB } = boa.import('sklearn.naive_bayes');

const { open, list, set } = boa.builtins();

function strip(str: string): string {
  return str.replace(/(^\s*)|(\s*$)/g, '');
}

function isdigit(str: string): boolean {
  return /^\d+$/.test(str);
}

interface AllWordsDict {
  [key: string]: [ string, number ];
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

export const TextProcessing = function(row_data: string[], row_class: string[]): any[][] {
  const data_list: string[][] = [];
  const class_list: string[] = [];

  row_data.forEach((data, i) => {
    const word_cut: string[] = jieba.cut(data, boa.kwargs({
      cut_all: false
    }));
    data_list.push(list(word_cut));
    class_list.push(row_class[i]);
  });
      
  // split train set and testing set
  const data_class_list = zip(data_list, class_list);
  random.shuffle(data_class_list);
  const [ train_data_list, train_class_list ] = unzip(data_class_list);
  const all_words_dict: AllWordsDict = {};
  for (const word_list of train_data_list) {
    for (const word of word_list) {
      if (!all_words_dict[word]) {
        all_words_dict[word] = [ word, 1 ];
      } else {
        all_words_dict[word][1] += 1;
      }
    }
  }

  const all_words_tuple_list = Object.values(all_words_dict).sort((item1, item2) => item2[1] - item1[1]);
  const all_words_list = unzip(all_words_tuple_list)[0];

  return [ all_words_list, train_data_list, train_class_list ];
};

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

function text_features(text: string, feature_words: string[]) {
  const text_words = set(text);
  return boa.eval`[1 if word in ${text_words} else 0 for word in ${feature_words}]`;
}

export const TextFeatures = function(train_data_list: string[], feature_words: string[]) {
  return train_data_list.map((text: string) => {
    return text_features(text, feature_words);
  });
};

export const processPredictData = function (data: any, all_words_list_path: string, stopwords_path: string): Promise<Set<string>> {
  const all_words_list = pickle.load(open(all_words_list_path, 'rb'));
  const word_cut = jieba.cut(data, boa.kwargs({
    cut_all: false
  }));

  const stopwords_file = stopwords_path;
  return MakeWordsSet(stopwords_file).then((stopwords_set) => {
    const feature_words = words_dict(all_words_list, stopwords_set);
    return list(word_cut).map((text: string) => {
      return text_features(text, feature_words);
    });
  });
};

export const save_all_words_list = function(feature_words: any, filepath: string) {
  pickle.dump(feature_words, open(filepath, 'wb'));
};

export const get_all_words_list = function(filepath: string) {
  return pickle.load(open(filepath, 'rb'));
};

export const getBayesModel = function() {
  return MultinomialNB();
};

export const saveBayesModel = function(classifier: any, filepath: string) {
  pickle.dump(classifier, open(filepath, 'wb'));
};

export const loadModel = function (filepath: string) {
  return pickle.load(open(filepath, 'rb'));
};
