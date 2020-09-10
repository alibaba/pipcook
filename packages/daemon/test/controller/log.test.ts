import { app, assert, mm } from 'midway-mock/bootstrap';

describe('test log controller', () => {
  afterEach(() => {
    mm.restore();
  });
  it('should get log', () => {
    app.mockClassFunction('pipelineService', 'getLogById', async (id: string) => {
      assert.equal(id, 'id');
      return [
        'log1',
        'log2'
      ];
    });
    return app
      .httpRequest()
      .get('/log/view/id')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect((res) => {
        assert.equal(res.body[0], 'log1');
        assert.equal(res.body[1], 'log2');
      });
  });
});
