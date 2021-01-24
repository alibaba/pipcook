import test from 'ava';
import {
  parsePluginName
} from './common';

test('parse from package name', async (t) => {
  const { protocol } = parsePluginName('@pipcook/core');
  t.is(protocol, 'npm');
  const { protocol: protocolWithScope } = parsePluginName('core');
  t.is(protocolWithScope, 'npm');
});
test('parse from absolute path', async (t) => {
  const url = '/root/core.gz';
  const { protocol, urlObject } = parsePluginName(url);
  t.is(protocol, 'fs');
  t.is(urlObject.href, url);
});
test('parse from tarball .tgz', async (t) => {
  const url = 'http://a.b.c:9090/core.tgz';
  const { protocol, urlObject } = parsePluginName(url);
  t.is(protocol, 'tarball');
  t.is(urlObject.href, url);
});
test('parse from tarball .gz', async (t) => {
  const url = 'http://a.b.c:9090/core.gz';
  const { protocol, urlObject } = parsePluginName(url);
  t.is(protocol, 'tarball');
  t.is(urlObject.href, url);
});
test('parse from unknown url', async (t) => {
  t.throws(() => {
    const url = 'http://a.b.c:9090/core.zip';
    parsePluginName(url);
  }, { instanceOf: TypeError });
});
test('parse from git+ssh', async (t) => {
  const url = 'git+ssh://a.b.c:9090/project@v1.0';
  const { protocol, urlObject } = parsePluginName(url);
  t.is(protocol, 'git');
  t.is(urlObject.href, url);
});
test('parse from git+https', async (t) => {
  const url = 'git+https://github.com/foobar/project@master';
  const { protocol, urlObject } = parsePluginName(url);
  t.is(protocol, 'git');
  t.is(urlObject.href, url);
});
test('parse from git+http', async (t) => {
  const url = 'git+http://github.com/foobar/project@master';
  const { protocol, urlObject } = parsePluginName(url);
  t.is(protocol, 'git');
  t.is(urlObject.href, url);
});
test('parse from invalid url', async (t) => {
  t.throws(() => {
    const url = './abc/tarball.tgz';
    parsePluginName(url);
  }, { instanceOf: TypeError });
});
