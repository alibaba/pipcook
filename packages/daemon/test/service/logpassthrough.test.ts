import { join } from 'path';
import { assert } from 'midway-mock/bootstrap';
import { LogPassthrough } from '../../src/service/trace-manager';
import * as fs from 'fs-extra';
import * as sinon from 'sinon';

const logFilename = join(__dirname, 'test.log');
const removeLog = async () => {
  return fs.remove(logFilename);
};

describe('test LogPassthrough', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('#create and destroy', async () => {
    const logger = new LogPassthrough();
    await logger.finish();
  });
  it('#create and destroy with log file', async () => {
    const logger = new LogPassthrough(logFilename);
    await logger.finish();
    assert.ok(await fs.pathExists(logFilename));
    await removeLog();
  });
  it('#create and destroy with log file', async () => {
    const logger = new LogPassthrough(logFilename);
    let inputContext = '';
    let i = 0;
    while (i++ < 500) {
      inputContext += `log test ${i}\n`;
      logger.write(`log test ${i}\n`);
    }
    await logger.finish();
    assert.ok(await fs.pathExists(logFilename));
    assert.equal(await fs.readFile(logFilename, 'utf8'), inputContext);
    await removeLog();
  });
});
