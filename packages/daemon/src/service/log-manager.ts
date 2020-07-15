import { Transform, TransformCallback } from 'stream';
import { generate } from 'shortid';
import { provide, scope, ScopeEnum } from 'midway';
import { StringDecoder } from 'string_decoder';

export interface LogObject {
  logTransfroms: LogTransfroms;
  error?: Error;
  finished: boolean;
  id: string;
}

class LogTransform extends Transform {
  decoder = new StringDecoder('utf8');
  last: string;
  constructor() {
    super({ objectMode: true });
  }
  _transform(chunk: any, encoding: string, callback: TransformCallback): void {
    if ( this.last === undefined ) {
      this.last = '';
    }
    this.last += this.decoder.write(chunk);
    let list = this.last.split(/\n|\r/);
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

export interface LogTransfroms {
  stdout: LogTransform;
  stderr: LogTransform;
}

@scope(ScopeEnum.Singleton)
@provide('logManager')
export class LogManager {
  logMap = new Map<string, LogObject>();

  createLogStream(): LogObject {
    const id = generate();
    const logTransfroms: LogTransfroms = { stdout: new LogTransform(), stderr: new LogTransform() };
    const logObj: LogObject = {id, finished: false, logTransfroms };
    this.logMap.set(id, logObj);
    return logObj;
  }

  getLog(id: string): LogObject {
    return this.logMap.get(id);
  }

  destroyLog(id: string, err?: Error) {
    const logs = this.logMap.get(id);
    logs.finished = true;
    if (err) {
      logs.logTransfroms.stderr.emit('error', err);
      logs.error = err;
    }
    logs.logTransfroms.stderr.emit('end');
    logs.logTransfroms.stdout.emit('end');
    return setTimeout(() => this.logMap.delete(id), 2000);
  }
}
