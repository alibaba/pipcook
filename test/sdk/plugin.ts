import { PipcookClient, TraceResp, PluginResp } from '../../packages/sdk';
const request = require('request');

describe('pipeline api.plugin test', () => {
  const client = new PipcookClient('http://localhost', 6927);
  let resp: TraceResp<PluginResp>;
  it('prepare', async () => {
    // prepare
    await client.plugin.remove();
  });
  it('create plugin by package name', async () => {
    // create plugin by package name
    resp = await client.plugin.createByName('@pipcook/plugins-chinese-poem-data-collect');
    expect(typeof resp).toBe('object');
    expect(resp.name).toBe('@pipcook/plugins-chinese-poem-data-collect');
    expect(typeof resp.traceId).toBe('string');
    await client.plugin.traceEvent(resp.traceId, (event: string, data: any) => {
      // log only for now
      expect([ 'log' ]).toContain(event);
      if (event === 'log') {
        console.log(`[${data.level}] ${data.data}`);
        expect(typeof data.level).toBe('string');
        expect(typeof data.data).toBe('string');
      }
    });

    // fetch plugin metadata
    const md = await client.plugin.fetch(resp.id);
    expect(typeof md).toBe('object');
    expect(typeof md.pipcook).toBe('object');
    expect(md.name).toBe(resp.name);
  });
  it('create plugin by tarball', async () => {
    // create plugin by tarball
    resp = await client.plugin.createByTarball(
      request.get('https://registry.npmjs.org/@pipcook/plugins-csv-data-collect/-/plugins-csv-data-collect-1.1.0.tgz')
    );
    expect(typeof resp).toBe('object');
    expect(resp.name).toBe('@pipcook/plugins-csv-data-collect');
    expect(resp.version).toBe('1.1.0');
    expect(typeof resp.traceId).toBe('string');
    await client.plugin.traceEvent(resp.traceId, (event: string, data: any) => {
      console.log(`[${data.level}] ${data.data}`);
      expect(typeof data.level).toBe('string');
      expect(typeof data.data).toBe('string');
    });
  });
  it('list plugins', async () => {
    // list plugins
    const plugins = await client.plugin.list();
    expect(Array.isArray(plugins)).toBe(true);
    expect(plugins.length).toBe(2);
  });
  it('get plugin', async () => {
    // get plugin
    const plugin = await client.plugin.get(resp.id);
    expect(typeof plugin).toBe('object');
    expect(plugin.id).toBe(resp.id);
    // expect(await client.plugin.get(resp.id + '1')).toThrow();
  });
  it('remove plugin', async () => {
    await client.plugin.remove(resp.id);
    let plugins = await client.plugin.list();
    expect(plugins.length).toBe(1);
    await client.plugin.remove();
    plugins = await client.plugin.list();
    expect(plugins.length).toBe(0);
  });
  it('clean', async () => {
    await client.plugin.remove();
  });
});
