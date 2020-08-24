import { PipcookClient } from '../../packages/sdk';

describe('test the index apis', () => {
  const client = new PipcookClient('http://localhost', 6927);
  it('list versions', async () => {
    const data = await client.listVersions();
    expect(typeof data.versions.daemon).toBe('string');
  });
  it('get daemon config', async () => {
    const config = await client.getConfig();
    expect(config).not.toBeNull();
  });
});
