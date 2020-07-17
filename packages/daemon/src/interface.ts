
/**
 * response of plugin query
 */
export interface PluginResp {
  id: string;
  name: string;
  version: string;
  category: string;
  datatype: string;
  namespace: string;
  dest: string;
}
/**
 * response of plugin install
 */
export interface PluginInstallingResp extends PluginResp {
  logId: string;
}
