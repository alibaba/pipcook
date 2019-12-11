import { UniformSampleData, OriginSampleData, ArgsType, parseAnnotation, DataAccessType} from '@pipcook/pipcook-core';


const templateDataAccess: DataAccessType = async (data: OriginSampleData[] | OriginSampleData, args?: ArgsType): Promise<UniformSampleData> => {
  return <UniformSampleData>{};
}

export default templateDataAccess;