export interface Statistic {
  metricName: string;
  metricValue: number;
}

export interface DeploymentResult {
  version: string;
  deployService: string;
  serviceapi: string;
  extraData: any;
} 

export interface PipObject {
  [key: string]: any;
}

export interface EvaluateResult {
  pass: boolean;
  [key: string]: any;
}

export class EvaluateError extends TypeError {
  public result: EvaluateResult;
  constructor(r: EvaluateResult) {
    super(`the evaluate result is not pass, ${JSON.stringify(r, null, 2)}`);
    this.result = r;
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PipcookMergeArray {}
