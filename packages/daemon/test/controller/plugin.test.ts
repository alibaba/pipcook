import { app, assert } from 'midway-mock/bootstrap';

describe('test plugin controller', () => {
  let pluginId: number;
  const name = '@pipcook/plugins-image-classification-data-collect';

  it('should list plugins', () => {
    return app
      .httpRequest()
      .get('/api/plugin')
      .expect('Content-Type', /json/)
      .expect((resp) => {
        assert.equal(Array.isArray(resp.body), true);
      })
      .expect(200);
  });

  it('should install a plugin', () => {
    return app
      .httpRequest()
      .post('/api/plugin')
      .send({ name })
      .expect((resp) => {
        assert.equal(typeof resp.body.id, 'string');
        assert.equal(resp.body.name, name);
        pluginId = resp.body.id;
      })
      .expect(200);
  });

  it('should get the plugin', () => {
    return app
      .httpRequest()
      .get(`/api/plugin/${pluginId}`)
      .expect((resp) => {
        assert.equal(resp.body.id, pluginId);
        assert.equal(resp.body.name, name);
      })
      .expect(200);
  });

  it('should get the plugin metadata', () => {
    return app
      .httpRequest()
      .get(`/api/plugin/${pluginId}/metadata`)
      .expect((resp) => {
        assert.equal(resp.body.name, name);
        assert.equal(resp.body.pipcook.category, 'dataCollect');
        assert.equal(resp.body.pipcook.datatype, 'image');
      })
      .expect(200);
  });
});
