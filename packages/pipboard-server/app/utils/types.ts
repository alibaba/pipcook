export interface PluginInfoI {
  name: string;
  params: object;
}

export type PluginMapI = Record<string, PluginInfoI>
