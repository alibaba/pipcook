import { sinon } from '@loopback/testlab';
import test from 'ava';
import { IndexController } from '../../../controllers';
import * as fs from 'fs-extra';
import { constants } from '@pipcook/pipcook-core';

test.serial.afterEach(() => {
  sinon.restore();
});

test.serial('list version info', async (t) => {
  const indexController = new IndexController();
  const stubReadJson = sinon.stub(fs, 'readJSON').resolves({ version: 'mock-1.0.0' });
  const versions = await indexController.versions();
  t.deepEqual(versions, { versions: { daemon: 'mock-1.0.0' } }, 'version info not current');
  t.is(stubReadJson.args[0][0], constants.PIPCOOK_DAEMON_SRC + '/package.json', 'should access the package.json of daemon');
});

test.serial('read config', async (t) => {
  const indexController = new IndexController();
  const mockConfig = { port: 1234 };
  const stubreadJson = sinon.stub(fs, 'readJSON').resolves({ port: 1234 });
  const config = await indexController.config();
  t.deepEqual(config, mockConfig, 'config not equal');
  t.is(stubreadJson.args[0][0], constants.PIPCOOK_DAEMON_CONFIG, 'should access the config file');
});

test.serial('read config but config file not found', async (t) => {
  const indexController = new IndexController();
  const stubreadJson = sinon.stub(fs, 'readJSON').rejects(new Error('mock error'));
  const config = await indexController.config();
  t.deepEqual(config, {}, 'config not equal');
  t.is(stubreadJson.args[0][0], constants.PIPCOOK_DAEMON_CONFIG, 'should access the config file');
});
