import { Transform, TransformCallback } from 'stream';
import { randomBytes } from 'crypto';
import { provide, scope, ScopeEnum } from 'midway';

export interface LogObject {
  logTransfroms: LogTransfroms;
  error?: Error;
  finished: boolean;
  id: string;
}

class LogTransform extends Transform {
  constructor() {
    super({ objectMode: true });
  }
  _transform(chunk: any, encoding: string, callback: TransformCallback): void {
    callback(undefined, chunk);
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
    const id = randomBytes(8).toString('hex');
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
    return setTimeout(() => this.logMap.delete(id), 2000);
  }
}
