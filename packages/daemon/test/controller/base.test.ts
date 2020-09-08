import { app } from 'midway-mock/bootstrap';


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
});
