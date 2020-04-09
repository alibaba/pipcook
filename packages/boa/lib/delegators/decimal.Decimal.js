

/**
 * @class decimal.Decimal
 */
class Decimal {
  constructor(T) {
    this._T = T;
  }
  // The followings are the operators of matrix
  /**
   * @method add
   */
  add(other) {
    return this.__add__(other);
  }
  /**
   * @method sub
   */
  sub(other) {
    return this.__sub__(other);
  }
  /**
   * @method mul
   */
  mul(other) {
    return this.__mul__(other);
  }
  /**
   * @method truediv
   */
  truediv(other) {
    return this.__truediv__(other);
  }
  /**
   * @method divmod
   */
  divmod(other) {
    return this.__divmod__(other);
  }
  /**
   * @method mod
   */
  mod(other) {
    return this.__mod__(other);
  }
}

module.exports = T => new Decimal(T);
