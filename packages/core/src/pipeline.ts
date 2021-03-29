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
  // pipeline version, '2.0' by default
  specVersion: string;
  // data source script url or sql
  dataSource: string;
  // data process script, set to null if not used
  dataflow: Array<string> | null;
  // model script url
  model: string;
  // artifact plugins and options
  artifacts: Array<Artifact>;
  // pipeline options
  options: Record<string, any>;
}
