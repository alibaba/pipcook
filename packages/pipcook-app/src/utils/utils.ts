export interface EasConfigI {
  easName: string;
  cpus: number;
  memory: number;
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  ossDir: string;
  gpu?: number;
  resource?: string;
  eascmd?: string;
  envPackName?: string;
  envScriptName?: string;
  updateOrCreate?: string;
}

export function getEasParam(easConfig: EasConfigI) {
  return {
    easName:easConfig.easName, 
    cpus: easConfig.cpus, 
    memory: easConfig.memory, 
    ossConfig: {
      region: easConfig.region,
      accessKeyId: easConfig.accessKeyId,
      accessKeySecret: easConfig.accessKeySecret,
      bucket: easConfig.bucket
    }, 
    ossDir: easConfig.ossDir,
    gpu: easConfig.gpu, 
    resource: easConfig.resource,
    eascmd: easConfig.eascmd,
    envPackName: easConfig.envPackName,
    envScriptName: easConfig.envScriptName
  } 
}