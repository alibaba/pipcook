import { PipcookClient, PluginInstallingResp } from '../../packages/sdk';

describe('pipeline api.plugin test', () => {
  const client = new PipcookClient('http://localhost', 6927);
  let resp: PluginInstallingResp;
  it('prepare', async () => {
    // prepare
    await client.plugin.remove();
  });
  it('create plugin', async () => {
    // create plugin
    resp = await client.plugin.create('@pipcook/plugins-chinese-poem-data-collect', true);
    expect(typeof resp).toBe('object');
    expect(resp.name).toBe('@pipcook/plugins-chinese-poem-data-collect');
    expect(typeof resp.logId).toBe('string');
    await client.plugin.log(resp.logId, (level: string, data: string) => {
      expect(typeof level).toBe('string');
      expect(typeof data).toBe('string');
    });
  }, 60 * 1000);
  it('list plugins', async () => {
    // list plugins
    const plugins = await client.plugin.list();
    expect(Array.isArray(plugins)).toBe(true);
    expect(plugins.length).toBe(1);
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
    expect(plugins.length).toBe(0);
    resp = await client.plugin.create('@pipcook/plugins-chinese-poem-data-collect', true);
    await client.plugin.log(resp.logId, undefined);
    plugins = await client.plugin.list();
    expect(plugins.length).toBe(1);
    await client.plugin.remove();
    plugins = await client.plugin.list();
    expect(plugins.length).toBe(0);
  }, 60 * 1000);
  it('clean', async () => {
    await client.plugin.remove();
  });
});
