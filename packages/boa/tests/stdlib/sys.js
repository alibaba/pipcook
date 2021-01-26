const test = require('ava');
const boa = require('../../');
const sys = boa.import('sys');

test('the `sys` constants', t => {
  t.assert(sys.abiflags);
  t.assert(sys.argv);
  t.assert(sys.base_exec_prefix);
  t.assert(sys.base_prefix);
  t.assert(sys.byteorder);
  t.assert(sys.builtin_module_names);
  t.assert(sys.copyright);
  t.assert(typeof sys.dont_write_bytecode === 'boolean');
  t.assert(sys.getdefaultencoding() === 'utf-8');
  t.assert(sys.getdlopenflags());
  t.assert(sys.hash_info.width);
  t.assert(sys.hash_info.inf);
  t.assert(sys.hash_info.nan === 0);
  t.assert(sys.hexversion);
  t.assert(sys.maxsize);
  t.assert(sys.maxunicode);
  t.assert(sys.path);
  t.assert(sys.platform === process.platform);
  t.assert(sys.prefix);
  t.assert(sys.thread_info.name);
  t.assert(sys.version);
  t.assert(sys.version_info.major === 3);
  t.assert(sys.version_info.minor >= 0);
});
