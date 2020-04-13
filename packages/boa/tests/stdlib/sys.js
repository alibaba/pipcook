

const { test } = require('tap');
const boa = require('../../');
const sys = boa.import('sys');

test('the `sys` constants', t => {
  t.ok(sys.abiflags);
  t.ok(sys.argv);
  t.ok(sys.base_exec_prefix);
  t.ok(sys.base_prefix);
  t.ok(sys.byteorder);
  t.ok(sys.builtin_module_names);
  t.ok(sys.copyright);
  t.ok(typeof sys.dont_write_bytecode === 'boolean');
  t.ok(sys.getdefaultencoding() === 'utf-8');
  t.ok(sys.getdlopenflags());
  t.ok(sys.hash_info.width);
  t.ok(sys.hash_info.inf);
  t.ok(sys.hash_info.nan === 0);
  t.ok(sys.hexversion);
  t.ok(sys.maxsize);
  t.ok(sys.maxunicode);
  t.ok(sys.path);
  t.ok(sys.platform === process.platform);
  t.ok(sys.prefix);
  t.ok(sys.thread_info.name);
  t.ok(sys.version);
  t.ok(sys.version_info.major === 3);
  t.ok(sys.version_info.minor >= 0);
  t.end();
});
