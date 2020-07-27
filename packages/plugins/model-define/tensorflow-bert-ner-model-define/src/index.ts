import { ModelDefineType, UniModel, ModelDefineArgsType, CsvDataset, CsvSample } from '@pipcook/pipcook-core';
import * as path from 'path';

const boa = require('@pipcook/boa');
const sys = boa.import('sys');
sys.path.insert(0, path.join(__dirname, '..'));
const { define } = boa.import('bert_ner_define.index');

const bertNerModelDefine: ModelDefineType = async (data: CsvDataset, args: ModelDefineArgsType): Promise<UniModel> => {
  const [ner, strategy, loss_fct, max_seq_length, tokenizer] = define({
    bert_model: '/Users/queyue/Documents/work/pipcook/cased_L-12_H-768_A-12',
    max_seq_length: 128,
    do_lower_case: false,
    gpus: false
  })


  //, bert_model, max_seq_length, num_train_examples, gpus
  const pipcookModel: UniModel = {
    model: ner,
    config: {
      strategy,
      loss_fct,
      max_seq_length,
      tokenizer
    },
    predict: function (inputData: CsvSample) {
      console.log('hello');
    }
  };
  return pipcookModel;

  return null as any;
};

export default bertNerModelDefine;
