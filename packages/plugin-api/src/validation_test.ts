import { averagePrecisionScore, averageRecallScore, meanAveragePrecision } from './validation';

describe('plugin api for validation', () => {
  it('should return appropriate precision score for classification problem', () => {
    const y_true = [ 0, 1, 2, 0, 1, 2 ];
    const y_pred = [ 0, 2, 1, 0, 0, 1 ];
    const score = averagePrecisionScore(y_true, y_pred);
    expect(Math.abs(score - 0.22)).toBeLessThan(0.01);
  });

  it('should return appropriate recall score for classification problem', () => {
    const y_true = [ 0, 1, 2, 0, 1, 2 ];
    const y_pred = [ 0, 2, 1, 0, 0, 1 ];
    const score = averageRecallScore(y_true, y_pred);
    expect(Math.abs(score - 0.33)).toBeLessThan(0.01);
  });
  
  it('should return appropriate recall score for classification problem', () => {
    const y_true = [ 0, 0, 1, 1 ];
    const y_pred = [ 0.1, 0.4, 0.35, 0.8 ];
    const score = meanAveragePrecision(y_true, y_pred);
    expect(Math.abs(score - 0.83)).toBeLessThan(0.01);
  });
});
