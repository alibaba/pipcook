import test from 'ava';
import * as sinon from 'sinon';
import * as ChildProcess from 'child_process';
import * as utils from './';
const importRefresh = require('import-fresh');

test.serial.afterEach(() => sinon.restore());

async function testExecAsync(t: any, isError: boolean): Promise<void> {
  const mockCmd = 'mock cmd';
  const mockOption = {};

  sinon.stub(ChildProcess, 'exec').callsFake(
    (
      command: string,
      options: ChildProcess.ExecOptions | null | undefined,
      callback?: (error: ChildProcess.ExecException | null, stdout: string, stderr: string) => void
    ): ChildProcess.ChildProcess => {
      t.is(command, mockCmd);
      t.deepEqual(options, mockOption);
      process.nextTick(() => {
        if (callback) {
          if (isError) {
            callback(new Error('mock Error'), 'stdout', 'stderr');
          } else {
            callback(null, 'stdout', 'stderr');
          }
        }
      });
      return {} as any;
    }
  );
  if (isError) {
    await t.throwsAsync(utils.execAsync(mockCmd, mockOption), { instanceOf: Error, message: 'mock Error' }, 'should throw error');
  } else {
    await t.notThrowsAsync(utils.execAsync(mockCmd, mockOption), 'should exec successfully');
  }
}

test.serial('exec command async', (t) => testExecAsync(t, false));
test.serial('exec command async but error thrown', (t) => testExecAsync(t, true));

test.serial('tty logger', (t) => {
  process.stdout.isTTY = true;
  process.stdout.rows = 1;
  process.stdout.columns = 1;
  const utils = importRefresh('./index');
  const subExit = sinon.stub(process, 'exit');
  t.true((utils.logger instanceof utils.TtyLogger), 'logger should be an instance of TtyLogger');
  const spinner = {
    succeed: sinon.stub(),
    info: sinon.stub(),
    warn: sinon.stub(),
    fail: sinon.stub(),
    start: sinon.stub()
  };
  (utils.logger as any).spinner = spinner;
  utils.logger.info('info');
  utils.logger.warn('warn');
  utils.logger.success('success');
  utils.logger.fail('fail', true, -1);
  utils.logger.fail('fail and not exit', false);
  utils.logger.fail('fail and not exit');
  utils.logger.start('start');
  t.true(spinner.succeed.calledOnce, 'spinner.succeed should be called once');
  t.true(spinner.start.calledOnce, 'spinner.start should be called once');
  t.true(spinner.warn.calledOnce, 'spinner.warn should be called once');
  t.true(spinner.fail.calledThrice, 'spinner.fail should be called thrice');
  t.true(spinner.info.calledOnce, 'spinner.info should be called once');
  t.true(subExit.calledTwice, 'process.exit should be called twice');
});

test.serial('default logger', (t) => {
  process.stdout.isTTY = false;
  process.stdout.rows = 1;
  process.stdout.columns = 1;
  const utils = importRefresh('./index');
  const subExit = sinon.stub(process, 'exit');
  t.true((utils.logger instanceof utils.DefaultLogger), 'logger should be an instance of DefaultLogger');
  const stubLog = sinon.stub(console, 'log');
  const stubWarn = sinon.stub(console, 'warn');
  const stubError = sinon.stub(console, 'error');
  utils.logger.info('info');
  utils.logger.warn('warn');
  utils.logger.success('success');
  utils.logger.fail('fail', true, -1);
  utils.logger.fail('fail and not exit', false);
  utils.logger.fail('fail and not exit');
  utils.logger.start('start');
  t.true(stubLog.calledThrice, 'spinner.start should be called thrice');
  t.true(stubWarn.calledOnce, 'spinner.warn should be called once');
  t.true(stubError.calledThrice, 'spinner.fail should be called thrice');
  t.true(subExit.calledTwice, 'process.exit should be called twice');
});
