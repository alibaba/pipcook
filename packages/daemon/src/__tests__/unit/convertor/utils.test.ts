import {
  sinon
} from '@loopback/testlab';
import test from 'ava';
import * as boa from '@pipcook/boa';
import * as utils from '../../../convertor/utils';

test.serial.afterEach(() => {
  sinon.restore();
});

test.serial('test initTVM', async (t) => {

  const mockImport = sinon.stub(boa, 'import').returns({});

  utils.initTVM();

  t.true(mockImport.calledThrice, 'import should be called thrice');
});

test.serial('test initTVM when tvm is not installed', async (t) => {

  const mockImport = sinon.stub(boa, 'import');
  mockImport.withArgs('tvm.relay').throws({});

  t.throws(utils.initTVM);

  t.true(mockImport.called, 'import should be called');
});


test.serial('test initTVM when emscripten is not installed', async (t) => {

  const mockImport = sinon.stub(boa, 'import');
  mockImport.withArgs('tvm.relay').returns({});
  mockImport.throws({});
  t.throws(utils.initTVM);

  t.true(mockImport.called, 'import should be called');
});

test.serial('test initTVM when keras is not installed', async (t) => {

  const mockImport = sinon.stub(boa, 'import');
  mockImport.withArgs('tvm.relay').returns({});
  mockImport.withArgs('tvm.contrib.emcc').returns({});
  mockImport.throws({});

  t.throws(utils.initTVM);

  t.true(mockImport.called, 'import should be called');
});
