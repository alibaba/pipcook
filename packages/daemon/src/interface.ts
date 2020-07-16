import { IPluginModel } from './model/plugin';
export interface RunParams {
  status: number;
  currentIndex?: number;
  evaluateMap?: string;
  evaluatePass?: boolean;
  endTime?: number;
  error?: string;
}

export interface PluginInstall {
  logId: string;
  plugin: IPluginModel;
}
