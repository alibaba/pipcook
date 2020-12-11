import test from 'ava';
import { Client } from '@loopback/testlab';
import { DaemonApplication } from '../..';
import { setupApplication } from '../__helpers__/test-helper';

let app: DaemonApplication;
let client: Client;

test.before('setupApplication', async () => {
  ({ app, client } = await setupApplication());
});

test.after(async () => {
  await app.stop();
});

test('invokes GET /ping', async (t) => {
  const res = await client.get('/api/plugin/nonexistent').expect(404);
  t.is(res.body.message, 'Entity not found: Plugin with id "nonexistent"');
});
