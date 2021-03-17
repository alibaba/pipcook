import test from 'ava';
import * as sinon from 'sinon';
import * as core from '@pipcook/pipcook-core';
import * as fs from 'fs-extra';
import { join } from 'path';
import * as ChildProcess from 'child_process';
import * as utils from './';

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