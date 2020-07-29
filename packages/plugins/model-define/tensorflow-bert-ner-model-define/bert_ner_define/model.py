from __future__ import absolute_import, division, print_function

import os

import tensorflow as tf

from .bert_modeling import BertConfig,BertModel
from .utils import tf_utils


class BertNer(tf.keras.Model):

    def __init__(self, bert_model,float_type, num_labels, max_seq_length, final_layer_initializer=None):
        super(BertNer, self).__init__()
        
        input_word_ids = tf.keras.layers.Input(shape=(max_seq_length,), dtype=tf.int32, name='input_word_ids')
        input_mask = tf.keras.layers.Input(shape=(max_seq_length,), dtype=tf.int32, name='input_mask')
        input_type_ids = tf.keras.layers.Input(shape=(max_seq_length,), dtype=tf.int32, name='input_type_ids')
        
        if type(bert_model) == str:
            bert_config = BertConfig.from_json_file(os.path.join(bert_model,"bert_config.json"))
        elif type(bert_model) == dict:
            bert_config = BertConfig.from_dict(bert_model)

        bert_layer = BertModel(config=bert_config,float_type=float_type)

        _, sequence_output = bert_layer(input_word_ids, input_mask,input_type_ids)
        self.bert = tf.keras.Model(inputs=[input_word_ids, input_mask, input_type_ids],outputs=[sequence_output])
        if type(bert_model) == str:
            init_checkpoint = os.path.join(bert_model,"bert_model.ckpt")
            checkpoint = tf.train.Checkpoint(model=self.bert)
            checkpoint.restore(init_checkpoint).assert_existing_objects_matched()
        
        if final_layer_initializer is not None:
            initializer = final_layer_initializer
        else:
            initializer = tf.keras.initializers.TruncatedNormal(
                stddev=bert_config.initializer_range)
        self.dropout = tf.keras.layers.Dropout(
            rate=bert_config.hidden_dropout_prob)
        self.classifier = tf.keras.layers.Dense(
            num_labels, kernel_initializer=initializer, activation='softmax',name='output', dtype=float_type)
    

    def call(self, input_word_ids,input_mask=None,input_type_ids=None,valid_mask=None, **kwargs):
        sequence_output = self.bert([input_word_ids, input_mask, input_type_ids],**kwargs)
        valid_output = []
        for i in range(sequence_output.shape[0]):
            r = 0
            temp = []
            for j in range(sequence_output.shape[1]):
                if valid_mask[i][j] == 1:
                    temp = temp + [sequence_output[i][j]]
                else:
                    r += 1
            temp = temp + r * [tf.zeros_like(sequence_output[i][j])]
            valid_output = valid_output + temp
        valid_output = tf.reshape(tf.stack(valid_output),sequence_output.shape)
        sequence_output = self.dropout(
            valid_output, training=kwargs.get('training', False))
        logits = self.classifier(sequence_output)
        return logits
