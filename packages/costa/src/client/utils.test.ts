import test from 'ava';
import * as utils from './utils';

test('should confiorm redirectList', (t) => {
  t.deepEqual(utils.redirectList, [ '@tensorflow/tfjs-node-gpu' ], 'check redirectList');
});

test('should redirect dependency', (t) => {
  t.deepEqual(utils.dependenciesCache, {}, 'cache should be empty');
  // cache module
  t.notThrows(() => utils.redirectDependency('sinon', [ __dirname ]), 'should not throw error');
  t.true('sinon' in utils.dependenciesCache, 'should cached sinon');
  // redirect module
  t.notThrows(() => utils.redirectDependency('sinon', [ __dirname ]), 'should not throw error');
});
