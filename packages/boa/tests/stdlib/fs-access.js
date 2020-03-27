'use strict';

const { test } = require('tap');
const path = require('path');
const boa = require('../../');

test('Object-oriented filesystem paths', t => {
  const { len, list } = boa.builtins();
  const { Path, PurePath } = boa.import('pathlib');
  {
    const currl = list(Path('.').iterdir());
    t.strictEqual(len(currl) > 0, true);
  }
  {
    const q = Path('./node_modules');
    t.strictEqual(q.exists(), true);
    t.strictEqual(q.is_dir(), true);
  }
  {
    const q = PurePath('foo', 'some/path', 'bar');
    t.strictEqual(q.toString(), 'foo/some/path/bar');
    t.strictEqual(q.name, 'bar');
    t.strictEqual(q.is_absolute(), false);
  }
  t.end();
});

test('Generate temporary files and directories', t => {
  const tempfile = boa.import('tempfile');
  const fp = tempfile.TemporaryFile();
  fp.write(boa.bytes('Hello world!'));
  fp.seek(0);
  t.strictEqual(fp.read().toString(), 'b\'Hello world!\'');
  fp.close();
  t.end();
});

test('Unix style pathname pattern expansion', t => {
  const glob = boa.import('glob');
  const match = path.join(__dirname, '../**/*.js');
  const files = glob.glob(match);
  console.log(`${files[0]}`);
  t.end();
});
