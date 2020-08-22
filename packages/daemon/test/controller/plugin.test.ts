import { app, assert } from 'midway-mock/bootstrap';
import { provide, init } from 'midway';
import { MockCosta } from '../mock/mock-costa';
import { TraceResp, PluginResp } from '../../src/interface';
import { PluginStatus } from '@pipcook/pipcook-core';

@provide('pluginRT')
class MockPluginRT {
  costa: MockCosta;
  @init()
  async connect(): Promise<void> {
    this.costa = new MockCosta();
  }
}
describe('test plugin controller', async () => {
  let plugin: TraceResp<PluginResp>;
  const installParams = { name: 'test-plugin', pyIndex: 'test-pyindex' };
  it('remove all plugins', async () => {
    app.applicationContext.bindClass(MockPluginRT);
    await app
      .httpRequest()
      .del('/api/plugin')
      .expect(204);
  });
  it('should list all plugins', () => {
    return app
      .httpRequest()
      .get('/api/plugin')
      .expect('Content-Type', /json/)
      .expect(200).then((res) => {
        assert.equal(res.body.length, 0);
      });
  });
  it('should get a nonexistent plugin', () => {
    return app
      .httpRequest()
      .get('/api/plugin/nonexistent-id')
      .expect('Content-Type', /json/)
      .expect(404);
  });
  it('should create a plugin', async () => {
    console.log('start to install plugin');
    await app
      .httpRequest()
      .post('/api/plugin').send(installParams)
      .expect('Content-Type', /json/)
      .expect(200).then((resp) => {
        plugin = resp.body;
        assert.equal(resp.body.name, installParams.name);
      });
    // trace plugin installation
    console.log('trace installation', plugin.traceId);
    await app
      .httpRequest()
      .get(`/api/plugin/event/${plugin.traceId}`)
      .expect('Content-Type', /event-stream/)
      .expect(200).then((resp) => {
        console.log('install log:', resp.text);
        assert.equal(typeof resp.text, 'string');
      });
    // checkout plugin status
    console.log('check installation');
    await app
      .httpRequest()
      .get(`/api/plugin/${plugin.id}`)
      .expect('Content-Type', /json/)
      .expect(200).then((resp) => {
        plugin = resp.body;
        assert.equal(plugin.status, PluginStatus.INSTALLED);
      });
  });
  it('should list a plugin', async () => {
    return app
      .httpRequest()
      .get('/api/plugin')
      .expect('Content-Type', /json/)
      .expect(200).then((res) => {
        assert.equal(res.body.length, 1);
        assert.equal(res.body[0].id, plugin.id);
      });
  });
  it('should reinstall a plugin', () => {
    return app
      .httpRequest()
      .put('/api/plugin').send(installParams)
      .expect('Content-Type', /json/)
      .expect(200).then((res) => {
        assert.equal(plugin.id, res.body.id);
      });
  });
  it('should remove a plugin', () => {
    return app
      .httpRequest()
      .del(`/api/plugin/${plugin.id}`)
      .expect(204);
  });
  it('should list 0 plugin', () => {
    return app
      .httpRequest()
      .get('/api/plugin')
      .expect('Content-Type', /json/)
      .expect(200).then((res) => {
        assert.equal(res.body.length, 0);
      });
  });
  it('clear', async () => {
    await app
      .httpRequest()
      .del('/api/plugin')
      .expect(204);
    await app
      .httpRequest()
      .get('/api/plugin')
      .expect(200)
      .then((res) => {
        assert.equal((res.body as PluginResp[]).length, 0);
      });
  });
});
