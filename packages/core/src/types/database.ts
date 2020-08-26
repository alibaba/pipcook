/**
 * The Pipeline status
 */
export enum PipelineStatus {
  /**
   * Init status.
   */
  INIT,
  /**
   * It represents the pipeline is running.
   */
  RUNNING,
  /**
   * It represents the pipeline is finished successfully.
   */
  SUCCESS,
  /**
   * It represents the pipeline is failed.
   */
  FAIL,
  /**
   * It represents the pipeline is canceled.
   */
  CANCELED,
  /**
   * It represents the pipeline is pending.
   */
  PENDING
}

/**
 * The pipeline database parameters list.
 */
export type PipelineDBParams = 'dataCollectParams' | 'dataAccessParams' | 'dataProcessParams' | 'modelDefineParams' | 'modelLoadParams' | 'modelTrainParams' | 'modelEvaluateParams';
