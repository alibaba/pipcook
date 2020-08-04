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
  constructor(filename?: string) {
    super({ objectMode: true });
    this.filename = filename;
  }

  async init(): Promise<void> {
    if (this.filename && !this.fd) {
      this.fd = await open(this.filename, 'w+');
    }
  }

  _transform(chunk: any, encoding: string, callback: TransformCallback): void {
    if (this.fd) {
      write(this.fd, chunk);
    }
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
    const logObj: LogObject = {
      id,
      stdout: new LogPassthrough(opts?.stdoutFile),
      stderr: new LogPassthrough(opts?.stderrFile)
    };
    Promise.all([
      logObj.stdout.init(),
      logObj.stderr.init()
    ]);
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
    return this.logMap.delete(id);
  }
}
