import { Sample } from "..";

/**
 * This is used to predict something from trained model.
 */
interface Predictable {
  /**
   * @param sample the input sample.
   * @returns the result by trained model.
   */
  (sample: Sample): any;
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
