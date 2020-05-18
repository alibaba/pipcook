import { strictEqual, equal } from 'assert';
import { len } from 'py:builtins';
import { Foobar } from 'py:tests.base.basic';

// define a extended class with basic functions
class Foobar2 extends Foobar {
  hellomsg(x) {
    return `hello <${x}> on ${this.test}`;
  }
}
const f = new Foobar2();
strictEqual(f.test, 'pythonworld');
equal(f.ping('rickyes'), 'hello <rickyes> on pythonworld');
equal(f.callfunc(x => x * 2), 233 * 2);

// define a class which overloads magic methods
class FoobarList extends Foobar {
  constructor() {
    super();
    // this is not an es6 array
    this.list = [1, 3, 7];
  }
  __getitem__(n) {
    return this.list[n];
  }
  __len__() {
    return len(this.list);
  }
}
const fl = new FoobarList();
equal(fl[0], 1);
equal(fl[1], 3);
equal(fl[2], 7);
equal(len(fl), 3);
