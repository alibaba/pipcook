import { sinon } from '@loopback/testlab';
import { join } from 'path';
import test from 'ava';
import { PluginTraceResp, TraceEvent, JobStatusChangeEvent, LogEvent, Tracer } from '../../../services';
import { PipelineStatus } from '@pipcook/pipcook-core';
import * as fs from 'fs-extra';
import { testConstructor } from '../../__helpers__';

test('should get a new PluginTraceResp object', testConstructor(PluginTraceResp));
test('should get a new TraceEvent object', testConstructor(TraceEvent, 'log'));
test('should get a new JobStatusChangeEvent object', testConstructor(JobStatusChangeEvent, PipelineStatus.PENDING));
test('should get a new LogEvent object', testConstructor(LogEvent, 'info', 'mock message'));

// test tracer
test('create and destroy tracer', async (t) => {
  const tracer = new Tracer();
  await t.notThrowsAsync(tracer.destroy());
});

test('create and destroy tracer with log files', async (t) => {
  const opts = { stdoutFile: join(__dirname, 'stdout.log'), stderrFile: join(__dirname, 'stderr.log') };
  const removeLogs = async () => {
    return Promise.all([
      fs.remove(opts.stdoutFile),
      fs.remove(opts.stderrFile)
    ]);
  };
  const tracerWithFile = new Tracer(opts);
  await t.notThrowsAsync(tracerWithFile.destroy());
  await removeLogs();
});

test('listen', async (t) => {
  const tracer = new Tracer();
  tracer.listen(sinon.stub());
  await t.notThrowsAsync(tracer.destroy());
});

test('test event: listen/dispatch/wait', async (t) => {
  const tracer = new Tracer();
  let called = false;
  tracer.listen((data) => {
    called = true;
    t.is(data.type, 'log');
    t.deepEqual(data.data, { level: 'info', data: 'message' });
  });
  process.nextTick(() => {
    tracer.dispatch(new LogEvent('info', 'message'));
    tracer.destroy();
  });
  await tracer.wait();
  t.true(called);
  await t.notThrowsAsync(tracer.destroy());
});
