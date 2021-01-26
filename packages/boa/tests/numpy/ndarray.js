const test = require('ava');
const boa = require('../../');
const np = boa.import('numpy');
const { len, tuple, type } = boa.builtins();

function _testshape(t) {
  return (s, expect) => {
    t.is(type(s).__name__, 'tuple', 'shape should be a tuple');
    t.is(len(s), expect.length,
      `the shape length for array should be in ${expect.length}`);
    expect.forEach((n, i) => {
      t.is(s[i], n, `shape[${i}] should be ${n}`);
    });
  };
}

test('the ndarry constructor', t => {
  const x = np.array([[1, 2, 3], [4, 5, 6]], np.int32);
  t.is(JSON.stringify(x), '[[1,2,3],[4,5,6]]');

  const testshape = _testshape(t);
  t.is(type(x).__name__, 'ndarray');
  t.is(x.dtype.name, 'int32', 'the dtype should be int32');
  t.is(x.ndim, 2);
  t.is(x.size, 6);

  testshape(x.shape, [2, 3]);
});

test('creating array from range', t => {
  const x = np.arange(15).reshape(3, 5);
  const testshape = _testshape(t);
  t.is(type(x).__name__, 'ndarray');
  t.is(x.ndim, 2);
  t.is(x.size, 15);
  testshape(x.shape, [3, 5]);
});

test('creating zeros array from shape', t => {
  const x = np.zeros(tuple([3, 4]));
  const testshape = _testshape(t);
  t.is(x.ndim, 2);
  t.is(x.size, 12);
  testshape(x.shape, [3, 4]);
});

test('creating ones array', t => {
  const x = np.ones(tuple([2, 3, 4]), boa.kwargs({ dtype: np.int16 }));
  const testshape = _testshape(t);
  t.is(x.dtype.name, 'int16');
  t.is(x.ndim, 3);
  t.is(x.size, 2 * 3 * 4);
  testshape(x.shape, [2, 3, 4]);
});

test('creating (uninit) array from shape', t => {
  const x = np.empty(tuple([3, 4]));
  const testshape = _testshape(t);
  t.is(x.ndim, 2);
  t.is(x.size, 12);
  testshape(x.shape, [3, 4]);
});
