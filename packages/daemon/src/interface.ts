
export interface PluginResp {
  id: string;
  name: string;
  version: string;
  category: string;
  datatype: string;
  namespace: string;
  dest: string;
}
export interface PluginInstallingResp extends PluginResp {
  logId: string;
}
