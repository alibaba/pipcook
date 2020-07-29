import { ModelDefineType, UniModel, ModelDefineArgsType, CsvDataset, CsvSample, download, constants, unZipData } from '@pipcook/pipcook-core';
import * as path from 'path';
import * as fs from 'fs-extra';

const boa = require('@pipcook/boa');
const tf = boa.import('tensorflow');
const sys = boa.import('sys');
sys.path.insert(0, path.join(__dirname, '..'));
const { define } = boa.import('bert_ner_define.index');
const { Ner } = boa.import('bert_ner_define.bert');

// constants for pre-trained models
const BASE_URL = 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/pipcook/models/';
const MODEL_SMALL = BASE_URL + 'tf20-bert-base-cased/base.zip';
const MODEL_LARGE = BASE_URL + 'tf20-bert-base-cased/large.zip';
const BASE_PATH = path.join(constants.PIPCOOK_HOME_PATH, 'bert-model');

const bertNerModelDefine: ModelDefineType = async (data: CsvDataset, args: ModelDefineArgsType): Promise<UniModel> => {
  const {
    bertModel = 'base',
    maxSeqLength = 128,
    gpus = '0',
    recoverPath
  } = args;

  if (![ 'base', 'large' ].includes(bertModel)) {
    throw new Error('bertModel can only be base or large');
  }

  const modelPath = path.join(BASE_PATH, bertModel);
  const modelDownloadUrl = bertModel === 'base' ? MODEL_SMALL : MODEL_LARGE;
  const modelCheckpoint = path.join(modelPath, 'bert_model.ckpt.index');

  if (!(await fs.pathExists(modelCheckpoint))) {
    await download(modelDownloadUrl, path.join(BASE_PATH, `${bertModel}.zip`));
    await unZipData(path.join(BASE_PATH, `${bertModel}.zip`), BASE_PATH);
    await fs.remove(path.join(BASE_PATH, `${bertModel}.zip`));
  }

  const [ ner, strategy, loss_fct, max_seq_length, tokenizer ] = define({
    bert_model: modelPath,
    max_seq_length: maxSeqLength,
    do_lower_case: false,
    gpus: gpus
  });

  let model: any;
  if (recoverPath) {
    model = Ner(recoverPath);
    const ids = tf.ones([ 1, 128 ], boa.kwargs({
      dtype: tf.int64
    }));
    ner(ids, ids, ids, ids, boa.kwargs({
      training: false
    }));
    ner.load_weights(path.join(recoverPath, 'model.h5'));
  }

  const pipcookModel: UniModel = {
    model: ner,
    config: {
      strategy,
      loss_fct,
      max_seq_length,
      tokenizer,
      bert_model: recoverPath || modelPath
    },
    predict: function (inputData: CsvSample) {
      const output = model.predict(inputData.data);
      return output.toString();
    }
  };
  return pipcookModel;
};

export default bertNerModelDefine;
