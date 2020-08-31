import { Transform, TransformCallback } from 'stream';
import { open, close, write } from 'fs-extra';
import { provide, scope, ScopeEnum } from 'midway';
import { StringDecoder } from 'string_decoder';
import { generateId } from '@pipcook/pipcook-core';

/**
 * Log obejct for plugin installing and pipeline running.
 */
export interface LogObject {
  // log id
  id: string;
  // stdout stream for log pipe
  stdout: LogPassthrough;
  // stderr stream for log pipe
  stderr: LogPassthrough;
}

export interface LogOptions {
  stdoutFile?: string;
  stderrFile?: string;
}

class LogPassthrough extends Transform {
  decoder = new StringDecoder('utf8');
  last: string;
  fd: number;
  filename: string;
  constructor(fd: number) {
    super({ objectMode: true });
    this.fd = fd;
  }

  _transform(chunk: any, encoding: string, callback: TransformCallback): void {
    if (this.last === undefined) {
      this.last = '';
    }
    this.last += this.decoder.write(chunk);
    const list = this.last.split(/\n|\r/);
    this.last = list.pop();
    list.forEach(line => {
      this.push(line);
    });
    callback();
  }
  _flush(callback: TransformCallback) {
    this.last += this.decoder.end();
    if (this.last) {
      this.push(this.last);
    }
    if (this.fd) {
      close(this.fd);
    }
    callback();
  }

  /**
   * cover Transform.write, otherwise if no `data` event listener,
   * the callback `_transform` will not be called, but we need to save the log to file.
   * @param args 
   */
  write(...args: any[]): boolean {
    if (this.fd) {
      write(this.fd, args[0]);
    }
    return super.write(args[0], args[1], args[2]);
  }
  writeLine(line: string) {
    this.write(`${line}\n`);
  }
}

@scope(ScopeEnum.Singleton)
@provide('logManager')
export class LogManager {
  logMap = new Map<string, LogObject>();

  /**
   * create a log object, must call the destory function to clean it up.
   */
  async create(opts?: LogOptions): Promise<LogObject> {
    const id = generateId();
    const fdOut = opts?.stdoutFile ? await open(opts?.stdoutFile, 'w+') : -1;
    const fdErr = opts?.stderrFile ? await open(opts?.stderrFile, 'w+') : -1;
    const logObj: LogObject = {
      id,
      stdout: new LogPassthrough(fdOut),
      stderr: new LogPassthrough(fdErr)
    };
    this.logMap.set(id, logObj);
    return logObj;
  }

  /**
   * get the log object by log id.
   * @param id log id
   */
  get(id: string): LogObject {
    return this.logMap.get(id);
  }

  /**
   * clean the log object up, emit the end event,
   * if the log progress ends with error, it'll be emitted before end event.
   * @param id log id
   * @param err error if have
   */
  destroy(id: string, err?: Error) {
    const log = this.logMap.get(id);
    if (err) {
      // make sure someone handles the error, otherwise the process will exit
      if (log.stderr.listeners('error').length > 0) {
        log.stderr.destroy(err);
      } else {
        console.error(`unhandled error from log: ${err.message}`);
        log.stderr.destroy();
      }
    } else {
      log.stderr.destroy();
    }
    log.stdout.destroy();
    if (log.stdout.fd > 0) {
      close(log.stdout.fd);
    }
    if (log.stderr.fd > 0) {
      close(log.stderr.fd);
    }
    return this.logMap.delete(id);
  }
}
