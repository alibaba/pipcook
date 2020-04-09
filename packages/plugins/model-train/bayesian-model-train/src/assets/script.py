#coding: utf-8
import os
import time
import random
import jieba
import sklearn
from sklearn.naive_bayes import MultinomialNB
import numpy as np
import csv
import pickle

def MakeWordsSet(words_file):
    words_set = set()
    with open(words_file, 'r') as fp:
        for line in fp.readlines():
            word = line.strip()
            if len(word)>0 and word not in words_set:
                words_set.add(word)
    return words_set

def TextProcessing(row_data, row_class):
    data_list = []
    class_list = []

    for i in range(len(row_data)):
        word_cut = jieba.cut(row_data[i], cut_all=False) 
        word_list = list(word_cut) 
        data_list.append(word_list)
        class_list.append(row_class[i])
            
    ## 划分训练集和测试集
    data_class_list = list(zip(data_list, class_list))
    random.shuffle(data_class_list)
    train_data_list, train_class_list = zip(*data_class_list)

    all_words_dict = {}
    for word_list in train_data_list:
        for word in word_list:
            if word in all_words_dict:
                all_words_dict[word] += 1
            else:
                all_words_dict[word] = 1
    all_words_tuple_list = sorted(all_words_dict.items(), key=lambda f:f[1], reverse=True)
    all_words_list = list(zip(*all_words_tuple_list))[0]

    return all_words_list, train_data_list, train_class_list




def words_dict(all_words_list, stopwords_set=set()):
    feature_words = []
    for t in range(0, len(all_words_list), 1):
        if not all_words_list[t].isdigit() and all_words_list[t] not in stopwords_set and 1<len(all_words_list[t])<5:
            feature_words.append(all_words_list[t])
    return feature_words


def TextFeatures(train_data_list, feature_words):
    def text_features(text, feature_words):
        text_words = set(text)
        features = [1 if word in text_words else 0 for word in feature_words]
        return features
    train_feature_list = [text_features(text, feature_words) for text in train_data_list]
    return train_feature_list

def processPredictData(data, all_words_list_path, stopwords_path):
    all_words_list = pickle.load(open(all_words_list_path, 'rb'))
    word_cut = jieba.cut(data, cut_all=False) 
    stopwords_file = stopwords_path
    stopwords_set = MakeWordsSet(stopwords_file)
    feature_words = words_dict(all_words_list, stopwords_set)
    def text_features(text, feature_words):
        text_words = set(text)
        features = [1 if word in text_words else 0 for word in feature_words]
        return features
    predict_feature_list = [text_features(text, feature_words) for text in [word_cut]]
    return predict_feature_list

def save_all_words_list(feature_words, filepath):
    pickle.dump(feature_words, open(filepath, 'wb'))

def getBayesModel():
    classifier = MultinomialNB()
    return classifier

def saveBayesModel(classifier, filepath):
    pickle.dump(classifier, open(filepath, 'wb'))

def loadModel(filepath):
    classifier = pickle.load(open(filepath, 'rb'))
    return classifier