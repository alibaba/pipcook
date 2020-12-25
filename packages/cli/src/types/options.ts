export interface CommonOptions {
  hostIp: string;
  port: number;
}

export interface PluginInstallOptions extends CommonOptions {
  tuna: boolean;
}

export interface PipelineCreateOptions extends PluginInstallOptions {
  name: string;
}

export interface ListPluginOptions extends CommonOptions {
  datatype?: string;
  category?: string;
  name?: string;
}

export interface RunAndDownloadOptions extends PluginInstallOptions {
  output: string;
}

