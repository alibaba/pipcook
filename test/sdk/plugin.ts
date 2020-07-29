import { PipcookClient, PluginInstallingResp } from '../../packages/sdk';
import ChildProcess from 'child_process';
import * as path from 'path';
import fs from 'fs-extra';

describe('pipeline api.plugin test', () => {
  const client = new PipcookClient('http://localhost', 6927);
  let resp: PluginInstallingResp;
  it('prepare', async () => {
    // prepare
    await client.plugin.remove();
  });
  it('create plugin by package name', async () => {
    // create plugin by package name
    resp = await client.plugin.createByName('@pipcook/plugins-chinese-poem-data-collect');
    expect(typeof resp).toBe('object');
    expect(resp.name).toBe('@pipcook/plugins-chinese-poem-data-collect');
    expect(typeof resp.logId).toBe('string');
    await client.plugin.log(resp.logId, (level: string, data: string) => {
      console.log(`[${level}] ${data}`);
      expect(typeof level).toBe('string');
      expect(typeof data).toBe('string');
    });
  }, 60 * 1000);
  it('create plugin by tarball', async () => {
    // create plugin by tarball
    let pkgPath = ChildProcess.spawnSync('npm', [ 'pack' ], { cwd: path.join(__dirname, '../../packages/plugins/data-access/csv-data-access')}).stdout.toString();
    pkgPath = pkgPath.replace(/\r|\n/g, '');
    resp = await client.plugin.createByTarball(fs.createReadStream(path.join(__dirname, '../../packages/plugins/data-access/csv-data-access', pkgPath)));
    expect(typeof resp).toBe('object');
    expect(resp.name).toBe('@pipcook/plugins-csv-data-access');
    expect(typeof resp.logId).toBe('string');
    await client.plugin.log(resp.logId, (level: string, data: string) => {
      console.log(`[${level}] ${data}`);
      expect(typeof level).toBe('string');
      expect(typeof data).toBe('string');
    });
  }, 60 * 1000);
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
  }, 60 * 1000);
  it('clean', async () => {
    await client.plugin.remove();
  });
});
