import test from 'ava';
import * as sinon from 'sinon';
import * as loader from '.';
import * as pythonLoader from './python';
import * as nodejsLader from './nodejs';

test('should load python plugin', (t) => {
  const mockResult = sinon.stub();
  sinon.stub(pythonLoader, 'default').returns(mockResult);
  t.deepEqual(
    loader.default({ name: 'mockPluginName', pipcook: { runtime: 'python' } } as any),
    mockResult,
    'should get the python plugin'
  );
});

test('should load nodejs plugin', (t) => {
  const mockResult = sinon.stub();
  sinon.stub(nodejsLader, 'default').returns(mockResult);
  t.deepEqual(
    loader.default({ name: 'mockPluginName', pipcook: { runtime: 'other' } } as any),
    mockResult,
    'should get the nodejs plugin'
  );
});
