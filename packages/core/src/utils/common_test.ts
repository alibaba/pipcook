import {
  parsePluginName
} from './common';

describe('test plugin name parser', () => {
  it('parse from package name', async () => {
    const { protocol } = parsePluginName('@pipcook/core');
    expect(protocol).toEqual('npm');
    const { protocol: protocolWithScope } = parsePluginName('core');
    expect(protocolWithScope).toEqual('npm');
  });
  it('parse from tarball .tgz', async () => {
    const url = 'http://a.b.c:9090/core.tgz';
    const { protocol, urlObject } = parsePluginName(url);
    expect(protocol).toEqual('tarball');
    expect(urlObject.href).toEqual(url);
  });
  it('parse from tarball .gz', async () => {
    const url = 'http://a.b.c:9090/core.gz';
    const { protocol, urlObject } = parsePluginName(url);
    expect(protocol).toEqual('tarball');
    expect(urlObject.href).toEqual(url);
  });
  it('parse from unknown url', async () => {
    expect(() => {
      const url = 'http://a.b.c:9090/core.zip';
      parsePluginName(url);
    }).toThrowError(TypeError);
  });
  it('parse from git+ssh', async () => {
    const url = 'git+ssh://a.b.c:9090/project@v1.0';
    const { protocol, urlObject } = parsePluginName(url);
    expect(protocol).toEqual('git');
    expect(urlObject.href).toEqual(url);
  });
  it('parse from git+https', async () => {
    const url = 'git+https://github.com/foobar/project@master';
    const { protocol, urlObject } = parsePluginName(url);
    expect(protocol).toEqual('git');
    expect(urlObject.href).toEqual(url);
  });
  it('parse from git+http', async () => {
    const url = 'git+http://github.com/foobar/project@master';
    const { protocol, urlObject } = parsePluginName(url);
    expect(protocol).toEqual('git');
    expect(urlObject.href).toEqual(url);
  });
  it('parse from invalid url', async () => {
    expect(() => {
      const url = './abc/tarball.tgz';
      parsePluginName(url);
    }).toThrowError(TypeError);
  });
});
