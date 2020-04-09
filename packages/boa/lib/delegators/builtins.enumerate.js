

class Enumerate {
  constructor(T, wrap) {
    this._T = T;
    this._wrap = wrap;
  }
  forEach(fn) {
    do {
      let curr = this._T.next();
      if (curr.done) {
        break;
      }
      fn(
        // data
        this._wrap(curr.value.__getitem__(1)),
        // index
        curr.value.__getitem__(0).toPrimitive()
      );
      // eslint-disable-next-line no-constant-condition
    } while (true);
  }
}

module.exports = (T, wrap) => new Enumerate(T, wrap);