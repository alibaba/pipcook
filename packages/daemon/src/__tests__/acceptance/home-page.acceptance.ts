import test from 'ava';
import { AppWithClient, setupApplication } from '../__helpers__/test-helper';

test.beforeEach('setupApplication', async t => {
  t.context = await setupApplication();
});

test.afterEach(async (t) => {
  await (t.context as AppWithClient).app.stop();
});

test('exposes a default home page', async t => {
  const client = (t.context as AppWithClient).client;
  await client
    .get('/')
    .expect(200)
    .expect('Content-Type', /text\/html/);
  t.pass();
});

test('exposes self-hosted explorer', async t => {
  const client = (t.context as AppWithClient).client;
  await client
    .get('/explorer/')
    .expect(200)
    .expect('Content-Type', /text\/html/)
    .expect(/<title>LoopBack API Explorer/);
  t.pass();
});
