import logging
import os
import tensorflow as tf

from .model import BertNer
from .tokenization import FullTokenizer

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

class InputExample(object):
    """A single training/test example for simple sequence classification."""

    def __init__(self, guid, text_a, text_b=None, label=None):
        """Constructs a InputExample.

        Args:
            guid: Unique id for the example.
            text_a: string. The untokenized text of the first sequence. For single
            sequence tasks, only this sequence must be specified.
            text_b: (Optional) string. The untokenized text of the second sequence.
            Only must be specified for sequence pair tasks.
            label: (Optional) string. The label of the example. This should be
            specified for train and dev examples, but not for test examples.
        """
        self.guid = guid
        self.text_a = text_a
        self.text_b = text_b
        self.label = label


def define(params):
    args = obj(params)
    args.do_lower_case = False
    args.multi_gpu = False
    
    tokenizer = FullTokenizer(os.path.join(args.bert_model, "vocab.txt"), args.do_lower_case)
    
    if args.multi_gpu:
        if len(args.gpus.split(',')) == 1:
            strategy = tf.distribute.MirroredStrategy()
        else:
            gpus = [f"/gpu:{gpu}" for gpu in args.gpus.split(',')]
            strategy = tf.distribute.MirroredStrategy(devices=gpus)
    elif args.gpus:
        gpu = args.gpus.split(',')[0]
        strategy = tf.distribute.OneDeviceStrategy(device=f"/gpu:{gpu}")
    else:
        strategy = tf.distribute.MirroredStrategy()


    with strategy.scope():
        ner = BertNer(args.bert_model, tf.float32, 12, args.max_seq_length)
        loss_fct = tf.keras.losses.SparseCategoricalCrossentropy(reduction=tf.keras.losses.Reduction.NONE)
    
    return [ner, strategy, loss_fct, args.max_seq_length, tokenizer]