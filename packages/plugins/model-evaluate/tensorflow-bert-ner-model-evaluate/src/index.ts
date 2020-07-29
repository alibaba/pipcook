import { ModelEvaluateType, EvaluateResult, UniModel, CsvDataset } from '@pipcook/pipcook-core';
import * as path from 'path';

const boa = require('@pipcook/boa');
const sys = boa.import('sys');
sys.path.insert(0, path.join(__dirname, '..'));
const { evaluate } = boa.import('bert_ner_evaluate.index');

const bertNerModelTrain: ModelEvaluateType = async (data: CsvDataset, model: UniModel): Promise<EvaluateResult> => {
  const { testCsvPath } = data;

  const evaluateResult = evaluate({
    ner: model.model,
    ...model.config,
    data_dir: testCsvPath,
    eval_batch_size: 8
  });

  return {
    pass: true,
    result: evaluateResult.toString()
  };

};

export default bertNerModelTrain;
