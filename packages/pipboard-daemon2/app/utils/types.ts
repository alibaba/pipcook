export interface PluginInfoI {
  name: string;
  params: object;
}

export interface PluginMapI {
  [key: string]: PluginInfoI;
}
