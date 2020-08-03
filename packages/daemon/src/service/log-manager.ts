import { Transform, TransformCallback } from 'stream';
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

class LogPassthrough extends Transform {
  decoder = new StringDecoder('utf8');
  last: string;
  constructor() {
    super({ objectMode: true });
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
    callback();
  }
}

@scope(ScopeEnum.Singleton)
@provide('logManager')
export class LogManager {
  logMap = new Map<string, LogObject>();

  /**
   * create a log object, must call the destory function to clean it up.
   */
  create(): LogObject {
    const id = generateId();
    const logObj: LogObject = { id, stdout: new LogPassthrough(), stderr: new LogPassthrough() };
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
    log.stderr.destroy(err);
    log.stdout.destroy();
    return this.logMap.delete(id);
  }
}
