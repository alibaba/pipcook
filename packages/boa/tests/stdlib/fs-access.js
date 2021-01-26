const test = require('ava');
const path = require('path');
const boa = require('../../');

test('Object-oriented filesystem paths', t => {
  const { len, list } = boa.builtins();
  const { Path, PurePath } = boa.import('pathlib');
  {
    const currl = list(Path('.').iterdir());
    t.is(len(currl) > 0, true);
  }
  {
    const q = Path('./node_modules');
    t.is(q.exists(), true);
    t.is(q.is_dir(), true);
  }
  {
    const q = PurePath('foo', 'some/path', 'bar');
    t.is(q.toString(), 'foo/some/path/bar');
    t.is(q.name, 'bar');
    t.is(q.is_absolute(), false);
  }
});

test('Generate temporary files and directories', t => {
  const tempfile = boa.import('tempfile');
  const fp = tempfile.TemporaryFile();
  fp.write(boa.bytes('Hello world!'));
  fp.seek(0);
  t.is(fp.read().toString(), 'b\'Hello world!\'');
  fp.close();
});

test('Unix style pathname pattern expansion', t => {
  const glob = boa.import('glob');
  const match = path.join(__dirname, '../**/*.js');
  const files = glob.glob(match);
  t.is(typeof files[0], 'string');
});
