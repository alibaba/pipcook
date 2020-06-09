import { ModelEvaluateType, UniModel, CsvDataset, ArgsType, EvaluateResult } from '@pipcook/pipcook-core';
const boa = require('@pipcook/boa');

const evaluate: ModelEvaluateType = async (dataset: CsvDataset, model: UniModel, args: ArgsType): Promise<EvaluateResult> => {
  const { expect = 0.5 } = args;
  if (dataset.testCsvPath) {
    const [ samples, precision, recall ] = model.model.test(dataset.testCsvPath);
    return {
      pass: precision >= expect,
      result: { precision, recall }
    };
  }
  return { pass: true, result: 'skip' };
};

export default evaluate;
