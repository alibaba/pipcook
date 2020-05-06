/**
 * The config for Plugin Runtime.
 */
export interface RuntimeConfig {
  /**
   * The directory to install plugins.
   */
  installDir: string;
  /**
   * The directory for dataset storage.
   */
  datasetDir: string;
  /**
   * The directory for component instance.
   */
  componentDir: string;
}

export interface PluginSource {
  from: 'fs' | 'npm' | null;
  name: string;
  uri: string | null;
}

export interface CondaConfig {
  python?: string;
  dependencies?: Record<string, string>;
}

export interface PluginPackage {
  name: string;
  version: string;
  main: string;
  description?: string;
  pipcook: {
    datatype: 'vision' | 'text' | 'table';
    source: PluginSource;
  };
  conda?: CondaConfig;
}

export interface NpmPackage extends PluginPackage {
  dist: {
    integrity: string;
    shasum: string;
    tarball: string;
  };
}

export interface NpmPackageMetadata {
  _id: string;
  _rev: string;
  name: string;
  'dist-tags': {
    beta: string;
    latest: string;
  };
  versions: Record<string, NpmPackage>;
}

/**
 * Plugin Runtime class.
 */
export declare class PluginRT {
  config: RuntimeConfig;
  constructor(config: RuntimeConfig);
  check(name: string): Promise<boolean>;
  getSource(name: string): PluginSource;
  /**
   * fetch and check if the package name is valid.
   * @param name the plugin package name.
   */
  fetch(name: string): Promise<PluginPackage>;
  /**
   * Install the given plugin by name.
   * @param name the plugin package name
   */
  install(pkg: PluginPackage): Promise<boolean>;
  /**
   * Create the Python requirements.txt file
   * @param name 
   * @param config 
   */
  createPythonRequirements(name: string, config: CondaConfig): string;
  /**
   * Run the plugin by given arguments.
   * @param name the plugin name
   * @param args the plugin args to run
   */
  run(pkg: PluginPackage, args?: Record<string, any>): Promise<any>;
}
