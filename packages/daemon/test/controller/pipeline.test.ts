import { app } from 'midway-mock/bootstrap';

describe('test pipeline controller', () => {
  it('should list all pipelines', () => {
    return app
      .httpRequest()
      .get('/api/pipeline')
      .expect('Content-Type', /json/)
      .expect(200);
  });
});
