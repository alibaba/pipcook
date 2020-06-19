import { executable } from './executable';

export type Learnable = LearnableCallback;

/**
 * The callback to represent a learnable function.
 */
export interface LearnableCallback {
  (...inputs: any[]): Promise<any>;
}

/**
 * Create the `Learnable` object with a given callback.
 *
 * @param callback the learnable callback
 */
export function createLearnable(callback: LearnableCallback): Learnable {
  if (!executable) {
    throw new TypeError('current application is not trained.');
  }
  return (...inputs: any[]): Promise<any> => {
    return callback(...inputs);
  };
}

export * as vision from './vision';
export * as nlp from './nlp';
export * as types from './types';
