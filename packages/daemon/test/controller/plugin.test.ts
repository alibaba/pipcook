import { app, assert } from 'midway-mock/bootstrap';
import { mm } from 'midway-mock/dist/mock';
import * as fs from 'fs-extra';

describe('test plugin controller', () => {
  const name = '@pipcook/plugins-image-classification-data-collect';
  afterEach(() => {
    mm.restore();
  })
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

  it('should reinstall a plugin', () => {
    app.mockClassFunction('pluginManager', 'installByName', async (pkgName: string, pyIndex?: string, force?: boolean) => {
      assert.equal(pkgName, name);
      assert.equal(pyIndex, 'http://pyindex.com');
      assert.equal(force, true);
      return {
        id: '123',
        name
      };
    });
    return app
      .httpRequest()
      .put('/api/plugin')
      .send({ name, pyIndex: 'http://pyindex.com' })
      .expect((resp) => {
        console.log(resp.body);
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

  it('try to get a nonexistent plugin', () => {
    app.mockClassFunction('pluginManager', 'findById', async (id: string): Promise<any> => {
      assert.equal(id, 'id');
      return undefined;
    });
    return app
      .httpRequest()
      .get('/api/plugin/id')
      .expect(404);
  });

  it('should upload plugin', async () => {
    // const form = new FormData();
    // form.append('file', fs.createReadStream(`${__dirname}/../../../../logo.png`));
    // const getLength = promisify(form.getLength.bind(form));
    // const length = await getLength();
    // const headers = Object.assign({ 'Content-Length': length }, form.getHeaders());

    app.mockClassFunction(
      'pluginManager',
      'installFromTarStream',
      async (tarball: NodeJS.ReadableStream, pyIndex?: string, force?: boolean): Promise<any> => {
      assert.equal(pyIndex, 'pyindex.com');
      assert.equal(force, false);
      return undefined;
    });
    return app
      .httpRequest()
      .post('/api/plugin/tarball')
      // .set(headers)
      .field('pyIndex', 'pyindex.com')
      .attach('file', fs.createReadStream(`${__dirname}/../../../../logo.png`))
      .expect(204);
  });

  it('should remove the plugin by id', () => {
    const mockPlugin = {
      id: 'id',
      name
    }
    app.mockClassFunction('pluginManager', 'findById', async (id: string) => {
      assert.equal(id, 'id');
      return mockPlugin;
    });
    app.mockClassFunction('pluginManager', 'uninstall', async (plugin: any) => {
      assert.deepEqual(plugin, mockPlugin);
    });
    return app
      .httpRequest()
      .del('/api/plugin/id')
      .expect(204);
  });

  it('remove nonexistent plugin', () => {
    app.mockClassFunction('pluginManager', 'findById', async (id: string): Promise<any> => {
      assert.equal(id, 'id');
      return undefined;
    });
    return app
      .httpRequest()
      .del('/api/plugin/id')
      .expect(404);
  });

  it('remove all plugins', () => {
    app.mockClassFunction('pluginManager', 'query', async (): Promise<any> => {
      return [];
    });
    app.mockClassFunction('pluginManager', 'uninstall', async (plugins: any[]): Promise<any> => {
      assert.deepEqual(plugins, []);
    });
    return app
      .httpRequest()
      .del('/api/plugin')
      .expect(204);
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
  it('should trace event', () => {
    app.mockClassFunction('traceManager', 'get', (id): any => {
      assert.equal(id, 'trace-id');
      let callback;
      return {
        listen: (cb) => {
          callback = cb;
        },
        wait: async () => {
          return callback({ type: 'mock type', data: 'mock data' });
        }
      }
    });
    return app
      .httpRequest()
      .get('/api/plugin/event/trace-id')
      .expect(200).expect((res) => {
        console.log('trace res', res.text);
        assert.ok((res.text as string).indexOf('mock type') >= 0);
        assert.ok((res.text as string).indexOf('mock data') >= 0);
      });
  });
});
