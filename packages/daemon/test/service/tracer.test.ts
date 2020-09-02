import { join } from 'path';
import { assert } from 'midway-mock/bootstrap';
import { Tracer, LogEvent } from '../../src/service/trace-manager';
import * as fs from 'fs-extra';
import * as sinon from 'sinon';

const opts = { stdoutFile: join(__dirname, 'stdout.log'), stderrFile: join(__dirname, 'stderr.log') };
const removeLogs = async () => {
  return Promise.all([
    fs.remove(opts.stdoutFile),
    fs.remove(opts.stderrFile)
  ]);
};

describe('test tracer', () => {
  afterEach(() => {
    sinon.restore();
  });

  let tracer: Tracer;
  let tracerWithFile: Tracer;
  it('#create and destroy tracer', async () => {
    tracer = new Tracer();
    await tracer.destroy();
  });

  it('#create and destroy tracer with log files', async () => {
    tracerWithFile = new Tracer(opts);
    await tracerWithFile.destroy();
    await removeLogs();
  });

  it('#listen', async () => {
    tracer = new Tracer();
    tracer.listen(() => { });
    await tracer.destroy();
  });

  it('#test event: listen/dispatch/wait', async () => {
    tracer = new Tracer();
    let called = false;
    tracer.listen((data) => {
      called = true;
      assert.equal(data.type, 'log');
      assert.deepEqual(data.data, { level: 'info', data: 'message' });
    });
    process.nextTick(() => {
      tracer.dispatch(new LogEvent('info', 'message'));
      tracer.destroy();
    });
    await tracer.wait();
    assert.ok(called);
    await tracer.destroy();
    tracer = undefined;
  });
});
