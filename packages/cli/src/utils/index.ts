import {
  exec,
  ExecOptions,
  ExecException
} from 'child_process';
import realOra = require('ora');
export * as Script from './script';
export * as Plugin from './plugin';
export * as Cache from './cache';
export * as Framework from './framework';

export function execAsync(cmd: string, opts?: ExecOptions): Promise<string> {
  return new Promise((resolve, reject): void => {
    exec(cmd, opts, (err: ExecException | null, stdout: string) => {
      if (err) {
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });
}

export function dateToString(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDay();
  const hour = date.getHours();
  const min = date.getMinutes();
  const sec = date.getSeconds();
  function fillZero(i: number): string {
    return i < 10 ? '0' + i : i.toString();
  }
  return `${year}${fillZero(month)}${fillZero(day)}${fillZero(hour)}${fillZero(min)}${fillZero(sec)}`;
}

interface Logger {
  success(message: string): void;
  fail(message: string, exit: boolean, code: number): void;
  info(message: string): void;
  warn(message: string): void;
}

export class TtyLogger implements Logger {
  spinner: realOra.Ora;

  constructor() {
    this.spinner = realOra({ stream: process.stdout });
  }

  success(message: string): void {
    this.spinner.succeed(message);
  }

  fail(message: string, exit = true, code = 1): void {
    this.spinner.fail(message);
    if (exit) {
      process.exit(code);
    }
  }

  info(message: string): void {
    this.spinner.info(message);
  }

  warn(message: string): void {
    this.spinner.warn(message);
  }

  start(message: string): void {
    this.spinner.start(message);
  }
}

export class DefaultLogger implements Logger {
  success(message: string): void {
    console.log('[success]: ' + message);
  }

  fail(message: string, exit = true, code = 1): void {
    console.error('[fail]: ' + message);
    if (exit) {
      process.exit(code);
    }
  }

  info(message: string): void {
    console.log('[info]: ' + message);
  }

  warn(message: string): void {
    console.warn('[warn]: ' + message);
  }

  start(message: string): void {
    console.log('[start]: ' + message);
  }
}

const { rows, columns, isTTY } = process.stdout;
export const logger = isTTY && rows > 0 && columns > 0 ? new TtyLogger() : new DefaultLogger();
