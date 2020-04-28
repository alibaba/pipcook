export interface Statistic {
  metricName: string;
  metricValue: number;
}

export interface PipObject {
  [key: string]: any;
}

export interface EvaluateResult {
  [key: string]: any;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PipcookMergeArray {}
