import { Writable, Transform, Readable, TransformCallback } from 'stream';
import { randomBytes } from 'crypto';
import { provide, scope, ScopeEnum } from 'midway';

export interface LogWriteStream {
  stream: Writable;
  id: string;
}

export interface LogReadStream {
  stream: Readable;
  id: string;
}

class LogTransform extends Transform {
  constructor() {
    super();
  }
  _transform(chunk: any, encoding: string, callback: TransformCallback): void {
    callback(undefined, chunk);
  }
}

@scope(ScopeEnum.Singleton)
@provide('logManager')
export class LogManager {
  logMap: Map<string, LogTransform> = new Map<string, LogTransform>();

  createLogStream(): LogWriteStream {
    const id = randomBytes(8).toString('hex');
    const stream = new LogTransform();
    console.log('createLogStream size', this.logMap.size);
    this.logMap.set(id, stream);
    return { id, stream };
  }

  getLog(id: string): LogReadStream {
    const stream = this.logMap.get(id);
    return { id, stream };
  }

  destroyLog(id: string, err?: Error) {
    if (err) {
      this.logMap.get(id).emit('error', err);
    } else {
      this.logMap.get(id).emit('end');
    }
    return this.logMap.delete(id);
  }
}
