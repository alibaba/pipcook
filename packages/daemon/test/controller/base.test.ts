import { app, assert } from 'midway-mock/bootstrap';


describe('test base controller', () => {
  it('validate failed', () => {
    return app
      .httpRequest()
      .post('/api/pipeline')
      .send({ a: 1 })
      .expect('Content-Type', /json/)
      .expect(400);
  });
  it('tracer not found', () => {
    return app
      .httpRequest()
      .get('/api/pipeline/event/id')
      .expect('Content-Type', /text/)
      .expect(200);
  });
  it('throw 500', () => {
    app.mockClassFunction('pipelineService', 'stopJob', async (id: string) => {
      assert.equal(id, 'id');
      throw new TypeError('mock error');
    });
    app.mockClassFunction('pipelineService', 'getJobsByPrefixId', async (prefix: string) => {
      assert.equal(prefix, 'id');
      return [ { id: prefix } ];
    });
    return app
      .httpRequest()
      .post('/api/job/id/cancel')
      .expect(500);
  });
});
