import { strictEqual } from 'assert';
import { getpid } from 'py:os';

// stdlib
import('py:os').then(mod => {
  strictEqual(getpid(), mod.getpid());
});

// thirdparty
import('py:numpy').then(mod => {
  const x = mod.array([[1, 2], [3, 4]]);
  const mb = mod.asmatrix(x);
  const m1 = mb.add(20);
  strictEqual(`${m1.A1}`, '[21 22 23 24]');
});

// custom
import('py:tests.base.basic').then(mod => {
  class Foobar2 extends mod.Foobar {
    hellomsg(x) {
      return `hello <${x}> on ${this.test}`;
    }
  }
  const f = new Foobar2();
  strictEqual(f.test, 'pythonworld');
  strictEqual(f.ping('rickyes'), 'hello <rickyes> on pythonworld');
  strictEqual(f.callfunc(x => x * 2), 233 * 2);
});
