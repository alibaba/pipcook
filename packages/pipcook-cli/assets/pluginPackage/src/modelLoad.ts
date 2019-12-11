import {ModelLoadType, PipcookModel, UniformSampleData, ModelLoadArgsType} from '@pipcook/pipcook-core';

const templateModelLoad: ModelLoadType = async (data: UniformSampleData, args?: ModelLoadArgsType): Promise<PipcookModel> => {
  return <PipcookModel>{};
}

export default templateModelLoad;