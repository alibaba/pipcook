import { PluginTypeI } from '@pipcook/pipcook-core';
import { RunnableResponse, BootstrapArg } from './runnable';

/**
 * The options to configure Costa runtime.
 */
export interface RuntimeOptions {
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

/**
 * This represents a source of a plugin.
 */
export interface PluginSource {
  from: 'fs' | 'npm' | null;
  name: string;
  uri: string | null;
}

/**
 * This represents requirements for Python and its packages.
 */
export interface CondaConfig {
  /**
   * The Python dependency, but it's solid to 3.7 for now.
   */
  python?: string;
  /**
   * The Python third-party dependencies.
   */
  dependencies?: Record<string, string>;
}

/**
 * Usually, it is used to represent some fields of package.json, 
 * and some pipcook fields are also added, see below for details.
 */
export interface PluginPackage {
  /**
   * the package name.
   */
  name: string;
  /**
   * the package version.
   */
  version: string;
  /**
   * the main script.
   */
  main: string;
  /**
   * the package description.
   */
  description?: string;
  /**
   * the package dependencies.
   */
  dependencies?: Record<string, string>;
  /**
   * The following objects are used to declare some information 
   * needed by the plugin at runtime.
   */
  pipcook: {
    /**
     * The plugin category.
     */
    category: PluginTypeI;
    /**
     * The data type of this plugin.
     */
    datatype: 'text' | 'image' | 'all';
    /**
     * The method to map for corresponding datatype.
     */
    method?: string;
    /**
     * The source of the plugin.
     */
    source: PluginSource;
    /**
     * The target information.
     */
    target?: {
      PYTHONPATH: string;
      DESTPATH: string;
    };
  };
  /**
   * The below is some information related to Python.
   */
  conda?: CondaConfig;
}

/**
 * It represents an object which extends `PluginPackage` with more
 * fields more about NPM.
 */
export interface NpmPackage extends PluginPackage {
  dist: {
    integrity: string;
    shasum: string;
    tarball: string;
  };
}

/**
 * It represents the metadata of a npm package, which fetchs from
 * npm registry.
 */
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

export declare class PluginRunnable {
  /**
   * the current working directory for this runnable.
   */
  public workingDir: string;
  
  /**
   * The current state.
   */
  public state: 'init' | 'idle' | 'busy';

  /**
   * Get the runnable value for the given response.
   * @param resp the value to the response.
   */
  valueOf(resp: RunnableResponse): Promise<object>;

  /**
   * Do start from a specific plugin.
   * @param name the plguin name.
   */
  start(pkg: PluginPackage, ...args: any[]): Promise<RunnableResponse | null>;

  /**
   * Destroy this runnable, this will kill process, and get notified on `afterDestory()`. 
   */
  destroy(): Promise<void>;
}

/**
 * The Costa runtime is for scheduling plugins and management.
 */
export declare class CostaRuntime {
  /**
   * The runtime config.
   */
  public options: RuntimeOptions;

  /**
   * Create a new Costa runtime by given config.
   * @param opts the runtime config.
   */
  constructor(opts: RuntimeOptions);
  /**
   * fetch and check if the package name is valid.
   * @param name the plugin package name.
   * @param cwd the current working directory to fetch package
   */
  fetch(name: string, cwd?: string): Promise<PluginPackage>;
  /**
   * Install the given plugin by a `PluginPackage` object.
   * @param pkg the plugin package name
   */
  install(pkg: PluginPackage, force?: boolean, pyIndex?: string): Promise<boolean>;
  /**
   * Uninstall matched plugins by name.
   */
  uninstall(name: string): Promise<boolean>;
  /**
   * Create a `PluginRunnable` object.
   */
  createRunnable(opts?: BootstrapArg): Promise<PluginRunnable>;
}
