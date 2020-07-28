import { DatasetProcessType, ArgsType, UniDataset } from '@pipcook/pipcook-core'

const templateDatasetProcess: DatasetProcessType = async (dataset: UniDataset, args: ArgsType): Promise<void> => {
  // Do some process to the whole dataset
};

export default templateDatasetProcess;
