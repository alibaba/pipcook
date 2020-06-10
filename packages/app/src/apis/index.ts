export class Learnable extends Function {
  callback: LearnableCallback;
};

/**
 * The callback to represent a learnable function.
 */
export interface LearnableCallback {
  (...inputs: any[]): Promise<any>;
};

/**
 * Create the `Learnable` object with a given callback.
 * 
 * @param callback the learnable callback
 */
export function createLearnable(callback: LearnableCallback): Learnable {
  throw new TypeError('current application is not trained.');
};

export * as vision from './vision';
export * as nlp from './nlp';
export * as types from './types';
