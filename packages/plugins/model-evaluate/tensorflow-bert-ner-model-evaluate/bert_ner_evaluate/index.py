import logging
import math
import os
import pandas as pd

import sys
import numpy as np
import tensorflow as tf
from fastprogress import master_bar, progress_bar
from seqeval.metrics import classification_report


logging.basicConfig(format='%(asctime)s - %(levelname)s - %(name)s -   %(message)s',
                    datefmt='%m/%d/%Y %H:%M:%S',
                    level=logging.INFO)
logger = logging.getLogger(__name__)

tf.compat.v1.logging.set_verbosity(tf.compat.v1.logging.ERROR)

class obj(object):
    def __init__(self, d):
        for a, b in d.items():
            if isinstance(b, (list, tuple)):
               setattr(self, a, [obj(x) if isinstance(x, dict) else x for x in b])
            else:
               setattr(self, a, obj(b) if isinstance(b, dict) else b)

def readfile(filename):
    df = pd.read_csv(filename)
    data = []
    sentence = []
    label = []

    columns = list(df.columns)

    for index, row in df.iterrows():
      inputs = str(row[columns[0]])
      labels = str(row[columns[len(columns) - 1]])
      if (inputs == 'nan' or labels == 'nan' or inputs == '' or inputs.startswith('-DOCSTART') or inputs == '\n'):
        if len(sentence) > 0:
          data.append((sentence, label))
          sentence = []
          label = []
        continue
      sentence.append(inputs)
      label.append(labels)
    if len(sentence) > 0:
      data.append((sentence, label))
      sentence = []
      label = []
    return data

class InputExample(object):

    def __init__(self, guid, text_a, text_b=None, label=None):
        self.guid = guid
        self.text_a = text_a
        self.text_b = text_b
        self.label = label

class DataProcessor(object):
    """Base class for data converters for sequence classification data sets."""

    def get_train_examples(self, data_dir):
        """Gets a collection of `InputExample`s for the train set."""
        raise NotImplementedError()

    def get_dev_examples(self, data_dir):
        """Gets a collection of `InputExample`s for the dev set."""
        raise NotImplementedError()

    def get_labels(self):
        """Gets the list of labels for this data set."""
        raise NotImplementedError()

    @classmethod
    def _read_tsv(cls, input_file, quotechar=None):
        """Reads a tab separated value file."""
        return readfile(input_file)

class NerProcessor(DataProcessor):
    """Processor for the CoNLL-2003 data set."""

    def get_train_examples(self, data_dir):
        """See base class."""
        return self._create_examples(
            self._read_tsv(data_dir), "train")

    def get_dev_examples(self, data_dir):
        """See base class."""
        return self._create_examples(
            self._read_tsv(data_dir), "dev")

    def get_test_examples(self, data_dir):
        """See base class."""
        return self._create_examples(
            self._read_tsv(data_dir), "test")

    def get_labels(self):
        return ["O", "B-MISC", "I-MISC",  "B-PER", "I-PER", "B-ORG", "I-ORG", "B-LOC", "I-LOC", "[CLS]", "[SEP]"]

    def _create_examples(self, lines, set_type):
        examples = []
        for i, (sentence, label) in enumerate(lines):
            guid = "%s-%s" % (set_type, i)
            text_a = ' '.join(sentence)
            text_b = None
            label = label
            examples.append(InputExample(
                guid=guid, text_a=text_a, text_b=text_b, label=label))
        return examples

class InputFeatures(object):
    """A single set of features of data."""

    def __init__(self, input_ids, input_mask, segment_ids, label_id, valid_ids=None, label_mask=None):
        self.input_ids = input_ids
        self.input_mask = input_mask
        self.segment_ids = segment_ids
        self.label_id = label_id
        self.valid_ids = valid_ids
        self.label_mask = label_mask


def convert_examples_to_features(examples, label_list, max_seq_length, tokenizer):
    """Loads a data file into a list of `InputBatch`s."""

    label_map = {label: i for i, label in enumerate(label_list, 1)}

    features = []
    for (ex_index, example) in enumerate(examples):
        textlist = example.text_a.split(' ')
        labellist = example.label
        tokens = []
        labels = []
        valid = []
        label_mask = []
        for i, word in enumerate(textlist):
            token = tokenizer.tokenize(word)
            tokens.extend(token)
            label_1 = labellist[i]
            for m in range(len(token)):
                if m == 0:
                    labels.append(label_1)
                    valid.append(1)
                    label_mask.append(True)
                else:
                    valid.append(0)
        if len(tokens) >= max_seq_length - 1:
            tokens = tokens[0:(max_seq_length - 2)]
            labels = labels[0:(max_seq_length - 2)]
            valid = valid[0:(max_seq_length - 2)]
            label_mask = label_mask[0:(max_seq_length - 2)]
        ntokens = []
        segment_ids = []
        label_ids = []
        ntokens.append("[CLS]")
        segment_ids.append(0)
        valid.insert(0, 1)
        label_mask.insert(0, True)
        label_ids.append(label_map["[CLS]"])
        for i, token in enumerate(tokens):
            ntokens.append(token)
            segment_ids.append(0)
            if len(labels) > i:
                label_ids.append(label_map[labels[i]])
        ntokens.append("[SEP]")
        segment_ids.append(0)
        valid.append(1)
        label_mask.append(True)
        label_ids.append(label_map["[SEP]"])
        input_ids = tokenizer.convert_tokens_to_ids(ntokens)
        input_mask = [1] * len(input_ids)
        label_mask = [True] * len(label_ids)
        while len(input_ids) < max_seq_length:
            input_ids.append(0)
            input_mask.append(0)
            segment_ids.append(0)
            label_ids.append(0)
            valid.append(1)
            label_mask.append(False)
        while len(label_ids) < max_seq_length:
            label_ids.append(0)
            label_mask.append(False)
        assert len(input_ids) == max_seq_length
        assert len(input_mask) == max_seq_length
        assert len(segment_ids) == max_seq_length
        assert len(label_ids) == max_seq_length
        assert len(valid) == max_seq_length
        assert len(label_mask) == max_seq_length

        if ex_index < 5:
            logger.info("*** Example ***")
            logger.info("guid: %s" % (example.guid))
            logger.info("tokens: %s" % " ".join(
                [str(x) for x in tokens]))
            logger.info("input_ids: %s" %
                        " ".join([str(x) for x in input_ids]))
            logger.info("input_mask: %s" %
                        " ".join([str(x) for x in input_mask]))
            logger.info(
                "segment_ids: %s" % " ".join([str(x) for x in segment_ids]))

        features.append(
            InputFeatures(input_ids=input_ids,
                          input_mask=input_mask,
                          segment_ids=segment_ids,
                          label_id=label_ids,
                          valid_ids=valid,
                          label_mask=label_mask))
    return features

def evaluate(params):
    args = obj(params)

    ner = args.ner
    tokenizer = args.tokenizer

    processor = NerProcessor()
    label_list = processor.get_labels()
    num_labels = len(label_list) + 1

    ids = tf.ones((1,128),dtype=tf.int64)
    _ = ner(ids,ids,ids,ids, training=False)

    eval_examples = processor.get_test_examples(args.data_dir)
    
    eval_features = convert_examples_to_features(
        eval_examples, label_list, args.max_seq_length, tokenizer)
    logger.info("***** Running evalution *****")
    logger.info("  Num examples = %d", len(eval_examples))
    logger.info("  Batch size = %d", args.eval_batch_size)

    all_input_ids = tf.data.Dataset.from_tensor_slices(
        np.asarray([f.input_ids for f in eval_features]))
    all_input_mask = tf.data.Dataset.from_tensor_slices(
        np.asarray([f.input_mask for f in eval_features]))
    all_segment_ids = tf.data.Dataset.from_tensor_slices(
        np.asarray([f.segment_ids for f in eval_features]))
    all_valid_ids = tf.data.Dataset.from_tensor_slices(
        np.asarray([f.valid_ids for f in eval_features]))

    all_label_ids = tf.data.Dataset.from_tensor_slices(
        np.asarray([f.label_id for f in eval_features]))
    all_label_mask = tf.data.Dataset.from_tensor_slices(
        np.asarray([f.label_mask for f in eval_features]))

    eval_data = tf.data.Dataset.zip(
        (all_input_ids, all_input_mask, all_segment_ids, all_valid_ids, all_label_ids, all_label_mask))
    batched_eval_data = eval_data.batch(args.eval_batch_size)

    loss_metric = tf.keras.metrics.Mean()
    epoch_bar = master_bar(range(1))
    pb_max_len = math.ceil(
        float(len(eval_features))/float(args.eval_batch_size))

    y_true = []
    y_pred = []
    label_map = {i : label for i, label in enumerate(label_list,1)}
    label_map[0] = '0'
    for epoch in epoch_bar:
        for (input_ids, input_mask, segment_ids, valid_ids, label_ids, label_mask) in progress_bar(batched_eval_data, total=pb_max_len, parent=epoch_bar):
                logits = ner(input_ids, input_mask,
                              segment_ids, valid_ids, training=False)
                label_mask = tf.reshape(label_mask,(-1,))
                logits = tf.reshape(logits,(-1,num_labels))
                logits_masked = tf.boolean_mask(logits,label_mask)
                logits = tf.argmax(logits_masked,axis=1)
                label_ids = tf.reshape(label_ids,(-1,))
                label_ids = tf.boolean_mask(label_ids,label_mask)
                temp_1 = []
                temp_2 = []
                for i in range(label_ids.shape[0]):
                    temp_1.append(label_map[label_ids[i].numpy()])
                    temp_2.append(label_map[logits[i].numpy()])
                y_true.append(temp_1)
                y_pred.append(temp_2)

    report = classification_report(y_true, y_pred, digits=4)
    return report



    with tf.GradientTape() as tape:
                logits = ner(input_ids, input_mask,segment_ids, valid_ids, training=True)
                label_mask = tf.reshape(label_mask,(-1,))
                logits = tf.reshape(logits,(-1,num_labels))
                logits_masked = tf.boolean_mask(logits,label_mask)
                label_ids = tf.reshape(label_ids,(-1,))
                label_ids_masked = tf.boolean_mask(label_ids,label_mask)
                cross_entropy = args.loss_fct(label_ids_masked, logits_masked)
                loss = tf.reduce_sum(cross_entropy) * (1.0 / args.train_batch_size)