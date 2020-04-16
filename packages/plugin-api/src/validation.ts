const boa = require('@pipcook/boa');
const { precision_score, recall_score, average_precision_score } = boa.import('sklearn.metrics');

export function averagePrecisionScore(y_true: any, y_pred: any) {
  return precision_score(y_true, y_pred, boa.kwargs({
    average: 'weighted'
  }));
}

export function averageRecallScore(y_true: any, y_pred: any) {
  return recall_score(y_true, y_pred, boa.kwargs({
    average: 'weighted'
  }));
}

export function meanAveragePrecision(y_true: any, y_pred: any) {
  return average_precision_score(y_true, y_pred, boa.kwargs({
    average: 'weighted'
  }));
}
