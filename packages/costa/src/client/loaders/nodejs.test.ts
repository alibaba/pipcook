import test from 'ava';
import * as sinon from 'sinon';
import * as mock from 'mock-require';
import * as nodejsLader from './nodejs';

test.serial.afterEach(() => mock.stopAll());

test.serial('should load nodejs plugin', (t) => {
  const stubPluginEntry = sinon.stub();
  mock('mockName', stubPluginEntry);
  t.is(nodejsLader.default({ name: 'mockName' } as any), stubPluginEntry, 'should get plugin entry');
});

test.serial('should load nodejs plugin with default entry', (t) => {
  const stubPluginEntry = sinon.stub();
  mock('mockName', { default: stubPluginEntry });
  t.is(nodejsLader.default({ name: 'mockName' } as any), stubPluginEntry, 'should get plugin entry');
});
