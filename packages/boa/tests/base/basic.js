const test = require('ava');
const boa = require('../../');
const builtins = boa.builtins();
const { PyGetAttrSymbol, PySetAttrSymbol, PyGetItemSymbol, PySetItemSymbol } = boa.symbols;

test('keyword arguments throws', t => {
  t.throws(() => boa.kwargs(false), { instanceOf: TypeError });
  t.throws(() => boa.kwargs(true), { instanceOf: TypeError });
  t.throws(() => boa.kwargs('foobar'), { instanceOf: TypeError });
  t.throws(() => boa.kwargs(123), { instanceOf: TypeError });
});

test('hash function', t => {
  t.is(Boolean(builtins.__hash__()), true);
  t.is(builtins['__notexists__'], undefined);

  const mlist = builtins.list([1, 3, 5]);
  t.is(JSON.stringify({ foobar: mlist }),
                '{"foobar":[1,3,5]}');

  mlist[0] = 2;
  mlist[1] = 4;
  t.is(mlist[0], 2);
  t.is(mlist[1], 4);
  t.is(JSON.stringify({ foofoo: mlist }),
                '{"foofoo":[2,4,5]}');
});

test('getattr and setattr with symbols', t => {
  // test for getattr and setattr
  const pybasic = boa.import('tests.base.basic');
  const f = new pybasic.Foobar();
  t.is(f[PyGetAttrSymbol]('test'), 'pythonworld', 'getattr is ok');
  f[PySetAttrSymbol]('test', 'updated');
  t.is(f[PyGetAttrSymbol]('test'), 'updated', 'setattr is ok');
});

test('getitem and setitem with symbols', t => {
  const mlist = builtins.list([1, 3]);
  // test for getitemm and setitem
  t.is(mlist[PyGetItemSymbol](0), 1, 'mlist[0] = 1');
  t.is(mlist[PyGetItemSymbol](1), 3, 'mlist[1] = 3');
  mlist[PySetItemSymbol](0, 100);
  t.is(mlist[PyGetItemSymbol](0), 100, 'setitem is ok');
  t.is(mlist[PyGetAttrSymbol]('__len__')(), 2, 'use getattr to check mlist length');
});

test('define a class extending python class', t => {
  class EmptyDict extends builtins.dict {
    constructor() {
      super([]);
      this.foobar = 10;
    }
  }
  const d = new EmptyDict();
  t.is(JSON.stringify(d), '{"foobar":10}');
  t.is(builtins.type(d).__name__, 'EmptyDict');
  t.is(d.foobar, 10);
});

test('define a extended class with basic functions', t => {
  const pybasic = boa.import('tests.base.basic');
  class Foobar extends pybasic.Foobar {
    hellomsg(x) {
      return `hello <${x}> on ${this.test}`;
    }
  }
  const f = new Foobar();
  t.is(f.test, 'pythonworld');
  t.is(f.ping('yorkie'), 'hello <yorkie> on pythonworld');
  t.is(f.callfunc(x => x * 2), 233 * 2);

  const v = f.testObjPass({
    input: 10,
    fn1: x => x * 2,
    scope: {
      fn2: y => y * y,
    },
  });
  // fn2(fn1(input));
  t.is(v, 400);
});

test('define a class which overloads magic methods', t => {
  const { len } = builtins;
  const pybasic = boa.import('tests.base.basic');
  class FoobarList extends pybasic.Foobar {
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
  const f = new FoobarList();
  t.is(f[0], 1);
  t.is(f[1], 3);
  t.is(f[2], 7);
  t.is(len(f), 3);
});

test.cb('with-statement normal flow', t => {
  const { open } = builtins;
  boa.with(open(__filename, 'r'), f => {
    console.log(f);
    t.pass();
    // no need to close because of `boa.with()`.
  }).then(() => {
    t.end();
  });
});

test('with-statement js exceptions', t => {
  const { open } = builtins;
  t.throws(() => boa.with({}), { instanceOf: TypeError });
  t.throws(() => boa.with(open(__filename, 'r')), { instanceOf: TypeError });
});

test.cb('with-statement python exceptions', t => {
  const { Foobar } = boa.import('tests.base.basic');
  const mfoobar = new Foobar();
  boa.with(mfoobar, () => {
    t.is(mfoobar.entered, true, 'foobar entered');
    // throw error
    mfoobar.hellomsg(233);
  });
  t.is(mfoobar.exited, true, 'foobar exited');

  mfoobar.__exitcode__ = 1;
  boa.with(mfoobar, () => mfoobar.hellomsg(233))
    .catch(() => {
      t.end();
    });
});

test('iteration protocols', t => {
  const { range } = builtins;
  const [r0, r1,, r3] = range(0, 10);
  t.is(r0[0], r0[1]);
  t.is(r1[0], r1[1]);
  t.is(r3[0], r3[1]);

  const [...iter] = range(0, 10);
  t.is(iter.length, 10);

  const [i0, ...iter2] = range(0, 10);
  t.is(i0[0], i0[1]);
  t.is(iter2.length, 9);
  t.throws(() => {
    // eslint-disable-next-line no-unused-vars
    const [_] = builtins;
    // Should throw the error
  }, { instanceOf: TypeError });
});

test('import a nonexistent module', t => {
  t.throws(() => boa.import('noneexistent-module'));
});
