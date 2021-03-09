import {
  exec,
  ExecOptions,
  ExecException
} from 'child_process';
import realOra = require('ora');

export function execAsync(cmd: string, opts?: ExecOptions): Promise<string> {
  return new Promise((resolve, reject): void => {
    exec(cmd, opts, (err: ExecException, stdout: string) => {
      err == null ? resolve(stdout) : reject(err);
    });
  });
}


interface Logger {
  success(message: string): void;
  fail(message: string, exit: boolean, code: number): void;
  info(message: string): void;
  warn(message: string): void;
}

class TtyLogger implements Logger {
  spinner: realOra.Ora;

  constructor() {
    this.spinner = realOra({ stream: process.stdout });
  }

  success(message: string) {
    this.spinner.succeed(message);
  }

  fail(message: string, exit = true, code = 1) {
    this.spinner.fail(message);
    if (exit) {
      process.exit(code);
    }
  }

  info(message: string) {
    this.spinner.info(message);
  }

  warn(message: string) {
    this.spinner.warn(message);
  }

  start(message: string) {
    this.spinner.start(message);
  }
}

class DefaultLogger implements Logger {
  success(message: string) {
    console.log('[success]: ' + message);
  }

  fail(message: string, exit = true, code = 1) {
    console.error('[fail]: ' + message);
    if (exit) {
      process.exit(code);
    }
  }

  info(message: string) {
    console.log('[info]: ' + message);
  }

  warn(message: string) {
    console.warn('[warn]: ' + message);
  }

  start(message: string) {
    console.log('[start]: ' + message);
  }
}

const { rows, columns, isTTY } = process.stdout;
export const logger = isTTY && rows > 0 && columns > 0 ? new TtyLogger() : new DefaultLogger();

