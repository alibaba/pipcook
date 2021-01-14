import { PluginTypeI } from './plugins';

/**
 * Plugin parameters.
 */
interface PluginConfig {
  package: string;
  params: any;
}

/**
 * The Pipeline configure schema
 */
export interface RunConfigI {
  /**
   * The pipeline name
   */
  name?: string;
  /**
   * The plugins configs
   */
  plugins: Record<PluginTypeI, PluginConfig>;
}
