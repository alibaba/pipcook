import test from 'ava';
import * as sinon from 'sinon';

test.serial('should load python plugin', (t) => {
  const boa = require('@pipcook/boa');
  const stubMain = sinon.stub().returns('mockResult');
  const stubBoaImport = sinon.stub(boa, 'import').callsFake((module) => {
    if (stubBoaImport.callCount === 1) {
      t.is(module, 'sys', 'should import sys');
      return { stdout: { flush: sinon.stub() }, stderr: { flush: sinon.stub() } };
    } else {
      t.is(module, 'node_modules.mockName', 'should import python plugin');
      return { main: stubMain };
    }
  });
  const pythonLader = require('./python');
  const entry = pythonLader.default({ name: 'mockName' } as any);
  t.is(entry(), 'mockResult', 'should get plugin result');
});
