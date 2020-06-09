export class Learnable extends Function {
  callback: LearnableCallback;
};

export interface LearnableCallback {
  (...inputs: any[]): Promise<any>;
};

export function createLearnable(callback: LearnableCallback): Learnable {
  const learnable = new Learnable();
  return learnable;
};

export * as vision from './vision';
export * as nlp from './nlp';
export * as types from './types';
