
/**
 * the type for artifact plugin export
 */
export interface ArtifactExports {
  /**
   * `initialize` is called before the pipeline start,
   * plugin can do initialization here, something like environment checking,
   * login to the server, etc. The options are defined in the pipeline metadata, like:
   * {
   *   artifacts:[{
   *     processor: 'server-uploader',
   *     options: {
   *       targetUrl: 'http://os.alibaba.com/pipcook/model/'
   *     }
   *   }]
   * }
   * @param options the options for the plugin
   */
  initialize(options: Record<string, any>): Promise<void>;
  /**
   * After the model being trained successfully, the function `build` will
   * be called with the model directory and options.
   * @param options the options for the plugin
   */
  build(modelDir: string, options: Record<string, any>): Promise<void>;
}

export interface ArtifactMeta {
  artifactExports: ArtifactExports;
  options: Record<string, any>;
}
