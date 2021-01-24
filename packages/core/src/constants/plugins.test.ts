import test from 'ava';
import {
  DATACOLLECT,
  DATAACCESS,
  DATAPROCESS,
  DATASETPROCESS,
  MODELTRAIN,
  MODELEVALUATE
} from './plugins';

test('should own some constants', (t) => {
  t.is(DATACOLLECT, 'dataCollect');
  t.is(DATAACCESS, 'dataAccess');
  t.is(DATAPROCESS, 'dataProcess');
  t.is(DATASETPROCESS, 'datasetProcess');
  t.is(MODELTRAIN, 'modelTrain');
  t.is(MODELEVALUATE, 'modelEvaluate');
});
