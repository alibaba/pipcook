#coding: utf-8

import allspark
import io
import numpy as np
import json
import threading
import pickle
import jieba
from sklearn.naive_bayes import MultinomialNB


def MakeWordsSet(words_file):
    words_set = set()
    with open(words_file, 'r', encoding='utf-8') as fp:
        for line in fp.readlines():
            word = line.strip()
            if len(word)>0 and word not in words_set:
                words_set.add(word)
    return words_set



def words_dict(all_words_list, stopwords_set=set()):
    feature_words = []
    for t in range(0, len(all_words_list), 1):
        if not all_words_list[t].isdigit() and all_words_list[t] not in stopwords_set and 1<len(all_words_list[t])<5:
            feature_words.append(all_words_list[t])
    return feature_words

def processPredictData(data):
    all_words_list = pickle.load(open('./model/feature_words.pkl', 'rb'))
    word_cuts = []
    for i in range(len(data)):
      word_cuts.append(jieba.cut(data[i], cut_all=False) )
    stopwords_file = './model/stopwords.txt'
    stopwords_set = MakeWordsSet(stopwords_file)
    feature_words = words_dict(all_words_list, stopwords_set)
    def text_features(text, feature_words):
        text_words = set(text)
        features = [1 if word in text_words else 0 for word in feature_words]
        return features
    predict_feature_list = [text_features(text, feature_words) for text in word_cuts]
    return predict_feature_list


def process(msg):
  msg_dict = json.loads(msg)
  texts = msg_dict['texts']
  predict_feature_list = processPredictData(texts)
  classifier = pickle.load(open('./model/model.pkl', 'rb'))
  result = classifier.predict(predict_feature_list)
  final_result = {
    'content': list(result)
  }
  return bytes(json.dumps(final_result), 'utf-8')

def worker(srv, thread_id):
  while True:
    msg = srv.read()
    try:
      rsp = process(msg)
      srv.write(rsp)
    except Exception as e:
      srv.error(500,bytes('invalid data format', 'utf-8'))

if __name__ == '__main__':    
    context = allspark.Context(4)
    queued = context.queued_service()

    workers = []
    for i in range(10):
        t = threading.Thread(target=worker, args=(queued, i))
        t.setDaemon(True)
        t.start()
        workers.append(t)
    for t in workers:
        t.join()


