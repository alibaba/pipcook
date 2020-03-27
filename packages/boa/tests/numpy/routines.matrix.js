'use strict';

const { test } = require('tap');
const boa = require('../../');
const np = boa.import('numpy');
// eslint-disable-next-line no-unused-vars
const { len, tuple, type } = boa.builtins();

// load the numpy.matlib
boa.import('numpy.matlib');

test('numpy.mat: interpret the input as a matrix.', t => {
  const x = np.array([[1, 2], [3, 4]]);
  const m = np.asmatrix(x);
  t.equal(type(m).__name__, 'matrix');
  t.end();
});

test('numpy.matlib.empty: return a new matrix without initializing entries', t => {
  const m = np.matlib.empty(tuple([2, 2]));
  t.equal(type(m).__name__, 'matrix');
  t.end();
});

test('numpy.matlib.zeros: return a matrix filled with zeros.', t => {
  const m1 = np.matlib.zeros(tuple([2, 3]));
  t.equal(type(m1).__name__, 'matrix');
  const m2 = np.matlib.zeros(2);
  t.equal(type(m2).__name__, 'matrix');
  t.end();
});

test('numpy.matlib.ones: return a matrix filled with ones.', t => {
  const m1 = np.matlib.ones(tuple([2, 3]));
  t.equal(type(m1).__name__, 'matrix');
  const m2 = np.matlib.ones(2);
  t.equal(type(m2).__name__, 'matrix');
  t.end();
});

test('numpy.matlib.eye: return a matrix with ones on the diagonal and zeros elsewhere.', t => {
  const m = np.matlib.eye(3, boa.kwargs({
    k: 1,
    dtype: np.float,
  }));
  t.equal(type(m).__name__, 'matrix');
  t.end();
});

test('numpy.matlib.identity: return the square identity matrix of given size.', t => {
  const m = np.matlib.identity(3, boa.kwargs({
    dtype: np.int,
  }));
  t.equal(type(m).__name__, 'matrix');
  t.end();
});

test('numpy.matlib.repmat: repeat a 0-D to 2-D array or matrix MxN times.', t => {
  {
    const a0 = np.array(1);
    const m0 = np.matlib.repmat(a0, 2, 3);
    console.log(`${m0}`);
  }
  {
    const a1 = np.arange(4);
    const m1 = np.matlib.repmat(a1, 2, 2);
    console.log(`${m1}`);
  }
  {
    const a2 = np.asmatrix(np.arange(6).reshape(2, 3));
    const m2 = np.matlib.repmat(a2, 2, 3);
    console.log(`${m2}`);
  }
  t.end();
});

test('numpy.matlib.rand: return a matrix of random values with given shape.', t => {
  {
    const n0 = np.matlib.rand(2, 3);
    console.log(`${n0}`);
  }
  {
    const n1 = np.matlib.rand(tuple([2, 3]));
    console.log(`${n1}`);
  }
  t.end();
});

test('numpy.matlib.randn: return a random matrix with data from the “standard normal” distribution.', t => {
  {
    const n0 = np.matlib.randn(1);
    console.log(`${n0}`);
  }
  {
    const n1 = np.matlib.randn(1, 2, 3);
    console.log(`${n1}`);
  }
  // TODO: matrix doesn't support operators like +/-/*.
  t.end();
});

test('numpy.matrix: operator functions', t => {
  const x = np.array([[1, 2], [3, 4]]);
  const mb = np.asmatrix(x);
  const m1 = mb.add(20);
  t.equal(`${m1.A1}`, '[21 22 23 24]');
  // simple test
  console.log(m1.sub(10));
  console.log(m1.mul(10));
  console.log(m1.rmul(3));
  console.log(m1.imul(3));
  console.log(m1.pow(2));
  console.log(m1.ipow(3));
  t.end();
});


