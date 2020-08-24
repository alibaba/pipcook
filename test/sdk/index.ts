import { PipcookClient } from '../../packages/sdk';

describe('test the index apis', () => {
  const client = new PipcookClient('http://localhost', 6927);
  it('list versions', async () => {
    const versions = await client.listVersions();
    console.log(versions);
  });
  it('get daemon config', async () => {
    const config = await client.getConfig();
    console.log(config);
  })
});
