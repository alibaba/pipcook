'use strict';

const boa = require('@pipcook/boa');

const jieba = boa.import('jieba');
const { MultinomialNB } = boa.import('sklearn.naive_bayes');
const pickle = boa.import('pickle');

const { open } = boa.builtins();

const fs = require('fs');
const readline = require('readline');

function strip (str) {
  return str.replace(/(^\s*)|(\s*$)/g, '');
}

function MakeWordsSet(words_file) {
  const words_set = new Set();
  const rs = fs.createReadStream(words_file);
  const rl = readline.createInterface({
    input: rs
  });
  return new Promise((resolve) => {
    rl.on('line', function (line) {
      const word = strip(line);
      if (word.length > 0 && !words_set.has(word)) {
        words_set.add(word);
      }
    });

    rl.on('close', function () {
      resolve(words_set);
    });
  });
}

function words_dict(all_words_list, stopwords_set = new Set()) {
  const feature_words = [];
  for (let word of all_words_list) {
    if (!word.isdigit() &&
        !stopwords_set.has(word) &&
        word.length > 1 &&
        word.length < 5) {
      feature_words.push(word);
    }
  }

  return feature_words;
}

exports.processPredictData = function (data, all_words_list_path, stopwords_path) {
  const all_words_list = pickle.load(open(all_words_list_path, 'rb'));
  const word_cut = jieba.cut(data, boa.kwargs({
    cut_all: false
  }));

  const stopwords_file = stopwords_path;
  const text_features = function (text, feature_words) {
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

  return MakeWordsSet(stopwords_file).then((stopwords_set) => {
    const feature_words = words_dict(all_words_list, stopwords_set);
    return word_cut.map((text) => {
      return text_features(text, feature_words);
    });
  });
};

exports.getBayesModel = function () {
  const classifier = MultinomialNB();
  return classifier;
};

exports.loadModel = function (filepath) {
  const classifier = pickle.load(open(filepath, 'rb'));
  return classifier;
};
