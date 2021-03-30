
/**
 * The type for artifact plugin export. As a pipcook artifact plugin, we need to export
 * two function named `initialize` and `build`.
 */
export interface ArtifactExports {
  /**
   * `initialize` is called before the pipeline starting,
   * plugin can do initialization here, something like environment checking,
   * login to the server, etc. The options are defined in the pipeline metadata, like:
   * ```json
   * {
   *   artifacts:[{
   *     processor: 'server-uploader',
   *     options: {
   *       targetUrl: 'http://os.alibaba.com/pipcook/model/'
   *     }
   *   }]
   * }
   * ```
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
