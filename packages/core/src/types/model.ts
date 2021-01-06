import { Sample } from '..';

/**
 * This is used to predict something from trained model.
 */
interface Predictable {
  /**
   * @param sample the input sample or an array of samples for batch predicting.
   * @returns the result by trained model.
   */
  (sample: Sample | Array<Sample>): any;
}

/**
 * The interface `UniModel` is the exchange interface between plugins in a pipeline.
 */
export interface UniModel {
  /**
   * The model property.
   */
  model: any;
  /**
   * A function to used by predicting the value.
   */
  predict: Predictable;
  /**
   * The matrics
   */
  metrics?: string[];
  /**
   * The model config.
   */
  config?: any;
}
