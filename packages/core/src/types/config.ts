import { PluginTypeI } from './plugins';

export interface Config {
  version: string;
}

export interface RunConfigParam {
  package: string;
  params: any;
}

export interface RunConfigI {
  plugins: Record<PluginTypeI, RunConfigParam>;
}
