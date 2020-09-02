import { join } from 'path';
import { app, assert } from 'midway-mock/bootstrap';
import { TraceManager, LogEvent, JobStatusChangeEvent } from '../../src/service/trace-manager';
import * as fs from 'fs-extra';

const opts = { stdoutFile: join(__dirname, 'stdout.log'), stderrFile: join(__dirname, 'stderr.log')};
const removeLogs = async () => {
  return Promise.all([
    fs.remove(opts.stdoutFile),
    fs.remove(opts.stderrFile)
  ]);
};

describe('test the trace manager service', () => {
  let id: string;
  it('#create trace without log file', async () => {
    const traceManager: TraceManager = await app.applicationContext.getAsync<TraceManager>('traceManager');
    const tracer = traceManager.create();
    id  = tracer.id;
  });

  it('#destory trace without log file', async () => {
    const traceManager: TraceManager = await app.applicationContext.getAsync<TraceManager>('traceManager');
    traceManager.destroy(id);
  });

  it('#create trace with log file', async () => {
    const traceManager: TraceManager = await app.applicationContext.getAsync<TraceManager>('traceManager');
    const tracer = traceManager.create(opts);
    id = tracer.id;
    setTimeout(async () => {
      assert.ok(await fs.pathExists(opts.stderrFile), 'stderr log file check failed');
      assert.ok(await fs.pathExists(opts.stdoutFile), 'stdout log file check failed');
    }, 500);
  });

  it('#get tracer', async () => {
    const traceManager: TraceManager = await app.applicationContext.getAsync<TraceManager>('traceManager');
    const trace = traceManager.get(id);
    assert.equal(trace.id, id);
  });

  it('#destory trace without log file', async () => {
    const traceManager: TraceManager = await app.applicationContext.getAsync<TraceManager>('traceManager');
    await traceManager.destroy(id);
    await removeLogs();
  });

  it('#test trace', async () => {
    const traceManager: TraceManager = await app.applicationContext.getAsync<TraceManager>('traceManager');
    const id = (traceManager.create(opts)).id;
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
    process.nextTick(async () => {
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
      await tracer.destroy(new TypeError(mockLog.error));
    });
    await tracer.wait();
    assert.ok(logInfoFlag && logWarnFlag && logErrorFlag && eventStartFlag && eventEndFlag, 'callback check');
    assert.ok(await fs.pathExists(opts.stderrFile) && await fs.pathExists(opts.stdoutFile), 'log file check');
    const stdoutContent = await fs.readFile(opts.stdoutFile, 'utf8');
    const stderrContent = await fs.readFile(opts.stderrFile, 'utf8');
    let i = 0;
    while (i++ < 50) {
      assert.ok(stdoutContent.indexOf(`${mockLog.info}${i}\n`) >= 0, `stdout log check: ${stdoutContent}`);
      assert.ok(stderrContent.indexOf(`${mockLog.warn}${i}\n`) >= 0, `stderr log check: ${stderrContent}`);
    }
    await removeLogs();
  });
});
