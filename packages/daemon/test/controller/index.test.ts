import { app } from 'midway-mock/bootstrap';
import { constants } from '@pipcook/pipcook-core';
import * as fse from 'fs-extra';
import * as sinon from 'sinon';

describe('test index controller', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should view versions', () => {
    return app
      .httpRequest()
      .get('/api/versions')
      .expect('Content-Type', /json/)
      .expect(`{"versions":{"daemon":"${require('../../package.json').version}"}}`)
      .expect(200);
  });
  it('should view config if config is not existed', () => {
    sinon.replace(fse, 'pathExists', async (...args) => {
      if (args[0] === constants.PIPCOOK_DAEMON_CONFIG) {
        return false;
      } else {
        await fse.pathExists.call(fse, args);
      }
    });
    return app
      .httpRequest()
      .get('/api/config')
      .expect('Content-Type', /json/)
      .expect('{}')
      .expect(200);
  });
  it('should view config if config is exists', () => {
    sinon.replace(fse, 'pathExists', async (...args) => {
      if (args[0] === constants.PIPCOOK_DAEMON_CONFIG) {
        return true;
      } else {
        await fse.pathExists.call(fse, args);
      }
    });
    sinon.replace(fse, 'readJSON', async (...args) => {
      if (args[0] === constants.PIPCOOK_DAEMON_CONFIG) {
        return { foobar: true };
      } else {
        await fse.readJSON.call(fse, args);
      }
    });
    return app
      .httpRequest()
      .get('/api/config')
      .expect('Content-Type', /json/)
      .expect('{"foobar":true}')
      .expect(200);
  });
});
