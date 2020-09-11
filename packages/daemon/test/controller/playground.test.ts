import { app, assert } from 'midway-mock/bootstrap';
import { mm } from 'midway-mock/dist/mock';
import * as sinon from 'sinon';
import axios from 'axios';
import * as fs from 'fs-extra';

describe('test playground controller', () => {
  afterEach(() => {
    mm.restore();
    sinon.restore();
  });
  it('should get model', () => {
    const mockGet = sinon.stub(axios, 'get').resolves(fs.createReadStream(`${__dirname}/playground.test.ts`) as any);
    return app
      .httpRequest()
      .get('/playground/model/model/name')
      .expect(204).expect(res => {
        assert.ok(
          mockGet.calledOnceWithExactly(
            'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/pipcook/showcase/model/name',
            { responseType: 'stream' }
          )
        );
      });
  });
});
