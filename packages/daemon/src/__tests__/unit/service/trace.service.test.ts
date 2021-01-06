import { join } from 'path';
import {
  sinon
} from '@loopback/testlab';
import test from 'ava';
import * as core from '@pipcook/pipcook-core';
import { TraceService, LogEvent, JobStatusChangeEvent } from '../../../services';
import * as fs from 'fs-extra';
import { mockFunctionFromGetter } from '../../__helpers__';

function initTraceService(): TraceService {
  return new TraceService();
}

const removeLogs = async (opts: any) => {
  return Promise.all([
    fs.remove(opts.stdoutFile),
    fs.remove(opts.stderrFile)
  ]);
};

test.serial.afterEach(() => {
  sinon.restore();
});

// test the trace manager service
test('create trace without log file then destroy', async (t) => {
  const traceService = initTraceService();
  mockFunctionFromGetter(core, 'generateId').returns('mockId');
  const tracer = traceService.create();
  t.is(tracer.id, 'mockId');
  await t.notThrowsAsync(traceService.destroy(tracer.id));
});

test.serial('#create trace with log file then destroy', async (t) => {
  const traceService = initTraceService();
  const opts = { stdoutFile: join(__dirname, 'stdout1.log'), stderrFile: join(__dirname, 'stderr1.log') };
  const mockCreateWriteStream = sinon.stub(fs, 'createWriteStream').returns({
    on: (event: string, cb: () => void) => {
      if (event === 'close') {
        process.nextTick(cb);
      }
    }, end: sinon.stub(), close: sinon.stub()
  } as any);
  const tracer = traceService.create(opts);
  await traceService.destroy(tracer.id);
  t.deepEqual(mockCreateWriteStream.args,
    [ [ opts.stdoutFile, { flags: 'w+' } ], [ opts.stderrFile, { flags: 'w+' } ] ],
    'log file check failed');
});

test('get tracer', async (t) => {
  const traceService = initTraceService();
  const tracer1 = traceService.create();
  const tracer2 = traceService.get(tracer1.id);
  t.deepEqual(tracer1, tracer2);
  await traceService.destroy(tracer1.id);
});

test('destroy a nonexistent tracer', async (t) => {
  const traceService = initTraceService();
  await t.notThrowsAsync(traceService.destroy('nonexistentId'));
});

test('test trace', async (t) => {
  const traceService = initTraceService();
  const opts = { stdoutFile: join(__dirname, 'stdout2.log'), stderrFile: join(__dirname, 'stderr2.log') };
  const tracer = traceService.create(opts);
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
        t.true(logData.data.data.startsWith(mockLog.info));
      } else if (logData.data.level === 'warn') {
        logWarnFlag = true;
        t.true(logData.data.data.startsWith(mockLog.warn));
      } else if (logData.data.level === 'error') {
        logErrorFlag = true;
        t.is(logData.data.data, mockLog.error);
      } else {
        t.fail(logData.data.level);
      }
    } else if (data.type) {
      const eventData = data as JobStatusChangeEvent;
      t.is(eventData.data.jobStatus, 1);
      if (eventData.data.stepAction === 'start') {
        eventStartFlag = true;
        t.is(eventData.data.step, 'dataCollect', 'dataCollect step check');
        t.is(eventData.data.queueLength, 1, 'dataCollect queue length step check');
      } if (eventData.data.stepAction === 'end') {
        eventEndFlag = true;
        t.is(eventData.data.step, 'dataAccess', 'dataAccess step check');
        t.is(eventData.data.queueLength, undefined, 'dataAccess queue length check');
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
  t.true(logInfoFlag && logWarnFlag && logErrorFlag && eventStartFlag && eventEndFlag, 'callback check');
  t.true(await fs.pathExists(opts.stderrFile) && await fs.pathExists(opts.stdoutFile), 'log file check');
  const stdoutContent = await fs.readFile(opts.stdoutFile, 'utf8');
  const stderrContent = await fs.readFile(opts.stderrFile, 'utf8');
  let i = 0;
  while (i++ < 50) {
    t.true(stdoutContent.indexOf(`${mockLog.info}${i}\n`) >= 0, `stdout log check: ${stdoutContent}`);
    t.true(stderrContent.indexOf(`${mockLog.warn}${i}\n`) >= 0, `stderr log check: ${stderrContent}`);
  }
  await removeLogs(opts);
});
