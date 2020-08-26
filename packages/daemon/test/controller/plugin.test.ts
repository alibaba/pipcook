import { app, assert } from 'midway-mock/bootstrap';

describe('test plugin controller', () => {
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
    app.mockClassFunction('pluginManager', 'installByName', async (pkgName: string, pyIndex?: string, force?: boolean) => {
      assert.equal(pkgName, name);
      assert.equal(pyIndex, 'http://pyindex.com');
      assert.equal(force, false);
      return {
        id: '123',
        name
      };
    });
    return app
      .httpRequest()
      .post('/api/plugin')
      .send({ name, pyIndex: 'http://pyindex.com', force: false })
      .expect((resp) => {
        assert.equal(typeof resp.body.id, 'string');
        assert.equal(resp.body.name, name);
      })
      .expect(200);
  });

  it('should get the plugin', () => {
    app.mockClassFunction('pluginManager', 'findById', async (id: string) => {
      assert.equal(id, 'id');
      return {
        id,
        name
      };
    });
    return app
      .httpRequest()
      .get('/api/plugin/id')
      .expect((resp) => {
        assert.equal(resp.body.id, 'id');
        assert.equal(resp.body.name, name);
      })
      .expect(200);
  });

  it('should get the plugin metadata', () => {
    app.mockClassFunction('pluginManager', 'findById', async (id: string) => {
      return {
        name,
        version: '1.0.0'
      };
    });
    app.mockClassFunction('pluginManager', 'fetch', async (fetchName: string) => {
      assert.equal(fetchName, `${name}@1.0.0`);
      return {
        name,
        pipcook: {
          category: 'dataCollect',
          datatype: 'image'
        }
      };
    });
    return app
      .httpRequest()
      .get('/api/plugin/id/metadata')
      .expect((resp) => {
        assert.equal(resp.body.name, name);
        assert.equal(resp.body.pipcook.category, 'dataCollect');
        assert.equal(resp.body.pipcook.datatype, 'image');
      })
      .expect(200);
  });
  it('should get 404 if id is not found', () => {
    return app
      .httpRequest()
      .get(`/api/plugin/not-exists/metadata`)
      .expect(404);
  });

  it('should fetch by name', () => {
    app.mockClassFunction('pluginManager', 'fetch', async (fetchName: string): Promise<any> => {
      assert.equal(fetchName, name);
      return {
        name,
        pipcook: {
          category: 'dataCollect',
          datatype: 'image'
        }
      };
    });
    return app
      .httpRequest()
      .get(`/api/plugin/metadata?name=${name}`)
      .expect((resp) => {
        assert.equal(resp.body.name, name);
        assert.equal(resp.body.pipcook.category, 'dataCollect');
        assert.equal(resp.body.pipcook.datatype, 'image');
      })
      .expect(200);
  });

  it('should fetch by name if the name is miss', () => {
    return app
      .httpRequest()
      .get('/api/plugin/metadata')
      .expect(400);
  });
});
