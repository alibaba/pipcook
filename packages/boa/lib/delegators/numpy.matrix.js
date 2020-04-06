

/**
 * @class numpy.Matrix
 * See https://github.com/numpy/numpy/blob/master/numpy/matrixlib/defmatrix.py#L75
 */
class Matrix {
  constructor(T) {
    this._T = T;
  }
  // The followings are the operators of matrix
  /**
   * add elements of two matrices.
   * @method add
   */
  add(other) {
    return this.__add__(other);
  }
  /**
   * subtract elements of two matrices.
   * @method sub
   */
  sub(other) {
    return this.__sub__(other);
  }
  /**
   * multiply elements of two matrices.
   * @method mul
   */
  mul(other) {
    return this.__mul__(other);
  }
  /**
   * @method rmul
   */
  rmul(other) {
    return this.__rmul__(other);
  }
  /**
   * @method imul
   */
  imul(other) {
    return this.__imul__(other);
  }
  /**
   * power root of each element of matrix.
   * @method pow
   */
  pow(other) {
    return this.__pow__(other);
  }
  /**
   * @method ipow
   */
  ipow(other) {
    return this.__ipow__(other);
  }
}

module.exports = T => new Matrix(T);
