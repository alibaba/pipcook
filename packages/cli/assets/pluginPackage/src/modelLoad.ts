import { ModelLoadType, UniModel, UniDataset, ModelDefineArgsType } from '@pipcook/pipcook-core';

const templateModelLoad: ModelLoadType = async (data: UniDataset, args: ModelDefineArgsType): Promise<UniModel> => {
  return {} as UniModel;
}

export default templateModelLoad;
