import { Transform, TransformCallback } from 'stream';
import { randomBytes } from 'crypto';
import { provide, scope, ScopeEnum } from 'midway';

export interface LogObject {
  logTransfroms: LogTransfroms;
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

interface LogTransfroms {
  stdout: LogTransform;
  stderr: LogTransform;
}

@scope(ScopeEnum.Singleton)
@provide('logManager')
export class LogManager {
  logMap: Map<string, LogTransfroms> = new Map<string, LogTransfroms>();

  createLogStream(): LogObject {
    const id = randomBytes(8).toString('hex');
    const logTransfroms: LogTransfroms = { stdout: new LogTransform(), stderr: new LogTransform() };
    this.logMap.set(id, logTransfroms);
    return { id, logTransfroms };
  }

  getLog(id: string): LogObject {
    const logTransfroms = this.logMap.get(id);
    return { id, logTransfroms };
  }

  destroyLog(id: string, err?: Error) {
    const logs = this.logMap.get(id);
    if (err) {
      logs.stdout.emit('error', err);
    }
    return this.logMap.delete(id);
  }
}
