import { app, assert, mm } from 'midway-mock/bootstrap';

describe('test app controller', () => {
  afterEach(() => {
    mm.restore();
  });
  it('should compile app', () => {
    app.mockClassFunction('appService', 'compile', async (src: string) => {
      assert.equal(src, 'source');
      return {
        executableSource: 'executableSource',
        pipelines: 'pipelines'
      };
    });
    return app
      .httpRequest()
      .post('/app/compile')
      .send({ src: 'source' })
      .expect('Content-Type', /json/)
      .expect(200)
      .expect((res) => {
        assert.equal(res.body.executableSource, 'executableSource');
        assert.equal(res.body.pipelines, 'pipelines');
      });
  });
});
