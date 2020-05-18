import { equal, ok } from 'assert';
import boa from '../../../lib/index.js';
import { type, tuple } from 'py:builtins';
import {
  Inf,
  NINF,
  NAN as NumpyNAN,
  array as NumpyArray,
  int32 as NumpyInt32,
  fv as NumpyFv,
  float as NumpyFloat,
} from 'py:numpy';
import matlib from 'py:numpy.matlib';

// numpy constants
equal(Inf, Infinity);
equal(NINF, -Infinity);
ok(isNaN(NumpyNAN, NaN));

// numpy array
const x = NumpyArray([[1, 2, 3], [4, 5, 6]], NumpyInt32);
equal(JSON.stringify(x), '[[1,2,3],[4,5,6]]');
equal(type(x).__name__, 'ndarray');
equal(x.dtype.name, 'int32', 'the dtype should be int32');
equal(x.ndim, 2);
equal(x.size, 6);

// numpy fv
equal(NumpyFv(0.05 / 12, 10 * 12, -100, -100), 15692.928894335748);

// numpy matlib
const m = matlib.empty(tuple([2, 2]));
equal(type(m).__name__, 'matrix');
const m2 = matlib.eye(3, boa.kwargs({
  k: 1,
  dtype: NumpyFloat,
}));
equal(type(m2).__name__, 'matrix');
