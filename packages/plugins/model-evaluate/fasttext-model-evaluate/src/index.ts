import { ModelEvaluateType, UniModel, CsvDataset, ArgsType, EvaluateResult } from '@pipcook/pipcook-core';

const evaluate: ModelEvaluateType = async (dataset: CsvDataset, model: UniModel, args: ArgsType): Promise<EvaluateResult> => {
  const { expect = 0.5 } = args;
  if (dataset.testCsvPath) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [ _samples, precision, recall ] = model.model.test(dataset.testCsvPath);
    return {
      pass: precision >= expect,
      result: { precision, recall }
    };
  }
  return { pass: true, result: 'skip' };
};

export default evaluate;
