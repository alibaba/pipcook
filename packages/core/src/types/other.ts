export interface Statistic {
  metricName: string;
  metricValue: number;
}

export interface EvaluateResultItem {
  pass?: boolean;
  [key: string]: any;
}

export interface EvaluateResultOnDatasets {
  train?: EvaluateResultItem;
  validate?: EvaluateResultItem;
  test?: EvaluateResultItem;
  pass?: boolean;
}

export type EvaluateResult = EvaluateResultItem | EvaluateResultOnDatasets;

export class EvaluateError extends TypeError {
  public result: EvaluateResult;
  constructor(r: EvaluateResult) {
    super(`the evaluate result is not pass, ${JSON.stringify(r, null, 2)}`);
    this.result = r;
  }
}
