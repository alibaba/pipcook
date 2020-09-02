import { join } from 'path';
import { app, assert } from 'midway-mock/bootstrap';
import { TraceManager, Tracer, LogEvent, JobStatusChangeEvent } from '../../src/service/trace-manager';
import * as fs from 'fs-extra';
import * as sinon from 'sinon';

const opts = { stdoutFile: join(__dirname, 'stdout.log'), stderrFile: join(__dirname, 'stderr.log')};
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
  it('#new tracer', async () => {
    tracer = new Tracer();
    tracerWithFile = new Tracer(opts);
  });

  it('#init logger', async () => {
    sinon.replace(fs, 'open', async (...args: any[]) => {
      assert.fail('should not open log file');
    });
    await tracer.init();
  });
  it('#init logger with log files', async () => {
    await tracer.init();
    sinon.replace(fs, 'open', async (...args: any[]) => {
      assert.ok([ opts.stdoutFile, opts.stderrFile ].indexOf(args[0]) >=0);
      assert.equal(args[1], 'w+');
      return 1;
    });
    await tracerWithFile.init();
  });
  it('#listen', async () => {
    tracer.listen(() => {});
  });
  it('#test event: listen/dispatch/wait', async () => {
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
    tracer = undefined;
  });
  it('#destory logger', async () => {
    tracer = new Tracer();
    await tracer.init();
    sinon.replace(fs, 'close', async (...args: any[]) => {
      assert.fail('should not close log file');
    });
    tracer.destroy();
    tracer = undefined;
  });
  it('#destory logger with logger', async () => {
    let called = false;
    sinon.replace(fs, 'close', async (...args: any[]) => {
      called = true;
      assert.equal(args[0], 1);
    });
    tracerWithFile.destroy();
    assert.ok(called);
    tracerWithFile = undefined;
  });
});

describe('test the trace manager service', () => {
  let id: string;
  it('#create trace without log file', async () => {
    const traceManager: TraceManager = await app.applicationContext.getAsync<TraceManager>('traceManager');
    const tracer = await traceManager.create();
    id  = tracer.id;
  });

  it('#destory trace without log file', async () => {
    const traceManager: TraceManager = await app.applicationContext.getAsync<TraceManager>('traceManager');
    traceManager.destroy(id);
  });

  it('#create trace with log file', async () => {
    const traceManager: TraceManager = await app.applicationContext.getAsync<TraceManager>('traceManager');
    const tracer = await traceManager.create(opts);
    id = tracer.id;
    assert.ok(await fs.pathExists(opts.stderrFile));
    assert.ok(await fs.pathExists(opts.stdoutFile));
  });

  it('#get tracer', async () => {
    const traceManager: TraceManager = await app.applicationContext.getAsync<TraceManager>('traceManager');
    const trace = traceManager.get(id);
    assert.equal(trace.id, id);
  });

  it('#destory trace without log file', async () => {
    const traceManager: TraceManager = await app.applicationContext.getAsync<TraceManager>('traceManager');
    traceManager.destroy(id);
    return removeLogs();
  });

  it('#test trace', async () => {
    await removeLogs();
    const traceManager: TraceManager = await app.applicationContext.getAsync<TraceManager>('traceManager');
    const id = (await traceManager.create(opts)).id;
    const tracer = await traceManager.get(id);
    assert.equal(tracer.id, id);
    let logInfoFlag = false;
    let logWarnFlag = false;
    let logErrorFlag = false;
    let eventStartFlag = false;
    let eventEndFlag = false;
    const mockLog = {
      info: 'info message',
      warn: 'warn message',
      error: 'error message'
    };
    tracer.listen((data) => {
      if (data.type === 'log') {
        const logData = data as LogEvent;
        if (logData.data.level === 'info') {
          logInfoFlag = true;
          assert.ok(logData.data.data.startsWith(mockLog.info));
        } else if (logData.data.level === 'warn') {
          logWarnFlag = true;
          assert.ok(logData.data.data.startsWith(mockLog.warn));
        } else if (logData.data.level === 'error') {
          logErrorFlag = true;
          assert.equal(logData.data.data, mockLog.error);
        } else {
          assert.fail(logData.data.level);
        }
      } else if (data.type) {
        const eventData = data as JobStatusChangeEvent;
        assert.equal(eventData.data.jobStatus, 1);
        if (eventData.data.stepAction === 'start') {
          eventStartFlag = true;
          assert.equal(eventData.data.step, 'dataCollect', 'dataCollect step check');
          assert.equal(eventData.data.queueLength, 1, 'dataCollect queue length step check');
        } if (eventData.data.stepAction === 'end') {
          eventEndFlag = true;
          assert.equal(eventData.data.step, 'dataAccess', 'dataAccess step check');
          assert.equal(eventData.data.queueLength, undefined, 'dataAccess queue length check');
        }
      }
    });
    tracer.dispatch(new JobStatusChangeEvent(
      1,
      'dataCollect',
      'start',
      1
    ));
    tracer.dispatch(new JobStatusChangeEvent(
      1,
      'dataAccess',
      'end'
    ));
    const loggers = tracer.getLogger();
    let i = 0;
    while (i++ < 50) {
      loggers.stdout.write(`${mockLog.info}${i}\n`);
      loggers.stderr.write(`${mockLog.warn}${i}\n`);
    }
    tracer.destroy(new TypeError(mockLog.error));
    await tracer.wait();
    assert.ok(logInfoFlag && logWarnFlag && logErrorFlag && eventStartFlag && eventEndFlag, 'callback check');
    assert.ok(await fs.pathExists(opts.stderrFile) && await fs.pathExists(opts.stdoutFile), 'log file check');
    const stdoutContent = await fs.readFile(opts.stdoutFile, 'utf8');
    const stderrContent = await fs.readFile(opts.stderrFile, 'utf8');
    i = 0;
    while (i++ < 50) {
      assert.ok(stdoutContent.indexOf(`${mockLog.info}${i}\n`) >= 0, 'stdout log check');
      assert.ok(stderrContent.indexOf(`${mockLog.warn}${i}\n`) >= 0, 'stderr log check');
    }
    return removeLogs();
  });
});
