import { ParsedUrlQuery } from 'querystring';

/**
 * There are three types of Pipcook script: `DataSource`, `Dataflow`, `Model`.
 */
export enum ScriptType {
  /**
   * The `DataSource` script needs to collect all the origin data,
   * and offers an API object for data access.
   */
  DataSource,
  /**
   * The `Dataflow` script processes the origin data form `DataSource` script.
   */
  Dataflow,
  /**
   * The `Model` script accesses the data from `DataSource` and `Dataflow` sciprts,
   * and trains the model.
   */
  Model
}

/**
 * The pipcook script stucture. It describes a scrpt and tell `Costa` how to run this script.
 */
export interface PipcookScript {
  /**
   * The script name.
   */
  name: string;
  /**
   * The script path in the file system.
   */
  path: string;
  /**
   * Script type.
   */
  type: ScriptType;
  /**
   * The script query data.
   */
  query: ParsedUrlQuery;
}

/**
 * Type of package in the framework.
 */
export enum PackageType {
  /**
   * Python package which can be used through `boa.import`.
   */
  Python = 'python',
  /**
   * JS module which can be used through `import`.
   */
  JS = 'js'
}

/**
 * package structure in pipcook framework
 */
/**
 * pipcook framework description struct
 */
export interface PipcookFramework {
  /**
   * The location of the framework.
   */
  path: string;
  /**
   * Framework name.
   */
  name: string;
  /**
   * Description of the framework.
   */
  desc: string | null;
  /**
   * Framework version.
   */
  version: string;
  /**
   * Arch of current machine, should be one of 'x86', 'x64'.
   */
  arch: string | null;
  /**
   * OS types, it should be one of 'darwin', 'win32', 'linux'.
   */
  platform: string | null;
  /**
   * Node version, it should be a semver string: see https://www.npmjs.com/package/semver.
   */
  nodeVersion: string | null;
  /**
   * The n-api version that the framework depends.
   */
  napiVersion: number | null;
  /**
   * Python runtime version, the python packages run on boa.
   */
  pythonVersion: string | null;
  /**
   * Python site-packages relative path in the directory, 'site-packages' by default.
   */
  pythonPackagePath: string | null;
  /**
   * Node modules relative path in the directory, 'node_modules' by default.
   */
  jsPackagePath: string | null;
}

/**
 * the struct which defines the scripts in a pipeline,
 *   datasource: the script use to fetch the data
 *   dataflow: some scripts use to process the data,
 *   model: define, train and evaluate model
 */
export interface ScriptConfig {
  dataSource: PipcookScript | null;
  dataflow: Array<PipcookScript> | null;
  model: PipcookScript;
}

/**
 * Artifact configuration, `processor` is the name and version of the artifact plugin,
 * like `pipcook-ali-oss-uploader@0.0.1`. The others are the options which will be
 * passed into the plugin.
 */
export interface Artifact {
  processor: string;
  [k: string]: any;
}

/**
 * pipeline configuration stucture
 */
export interface PipelineMeta {
  /**
   * pipeline version, '2.0' by default
   */
  specVersion: string;
  /**
   * data source script url or sql
   */
  dataSource: string;
  /**
   * data process script, set to null if not used
   */
  dataflow: Array<string> | null;
  /**
   * model script url
   */
  model: string;
  /**
   * artifact plugins and options
   */
  artifacts: Array<Artifact>;
  /**
   * pipeline options
   */
  options: Record<string, any>;
}
