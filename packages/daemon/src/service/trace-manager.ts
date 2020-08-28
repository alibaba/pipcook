import { Transform, TransformCallback } from 'stream';
import { EventEmitter } from 'events';
import { open, close, write } from 'fs-extra';
import { provide, scope, ScopeEnum } from 'midway';
import { StringDecoder } from 'string_decoder';
import { generateId, PipelineStatus, PluginTypeI } from '@pipcook/pipcook-core';

export type PipcookEventType = 'log' | 'job_status';

export interface JobStatusChangeEvent {
  jobStatus: PipelineStatus;
  step?: PluginTypeI;
  stepAction?: 'start' | 'end';
}
/**
 * Log obejct for plugin installing and pipeline running.
 */
export class Tracer {
  // log id
  id: string;
  // stdout stream for log pipe
  stdout: LogPassthrough;
  // stderr stream for log pipe
  stderr: LogPassthrough;
  // event emitter
  emitter: EventEmitter;

  constructor(fdOut: number, fdErr: number) {
    this.id = generateId();
    this.stdout = new LogPassthrough(fdOut);
    this.stderr = new LogPassthrough(fdErr);
    this.emitter = new EventEmitter();
  }

  listenLog(level: 'info' | 'warn', cb: (level: string, message: string) => void): Promise<void> {
    return new Promise(resolve => {
      const logStream = level === 'info' ? this.stdout : this.stderr;
      logStream.on('data', message => {
        cb(level, message);
      });
      logStream.on('close', resolve);
      logStream.on('error', err => {
        cb('error', err.message);
      });
    });
  }

  listenEvent(cb: (type: PipcookEventType, data: any) => void): void {
    this.emitter.on('trace', (type: PipcookEventType, data: any) => {
      cb(type, data);
    });
  }

  pushEvent(type: PipcookEventType, data: any) {
    this.emitter.emit('trace', { type, data });
  }
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
    if (this.fd > 0) {
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
@provide('traceManager')
export class TraceManager {
  tracerMap = new Map<string, Tracer>();

  /**
   * create a log object, must call the destory function to clean it up.
   */
  async create(opts?: LogOptions): Promise<Tracer> {
    const fdOut = opts?.stdoutFile ? await open(opts?.stdoutFile, 'w+') : -1;
    const fdErr = opts?.stderrFile ? await open(opts?.stderrFile, 'w+') : -1;
    const tarcer: Tracer = new Tracer(fdOut, fdErr);
    this.tracerMap.set(tarcer.id, tarcer);
    return tarcer;
  }

  /**
   * get the tarcer object by trace id.
   * @param id trace id
   */
  get(id: string): Tracer {
    return this.tracerMap.get(id);
  }

  /**
   * clean the tracer object up, emit the end event,
   * if the trace progress ends with error, it'll be emitted before end event.
   * @param id trace id
   * @param err error if have
   */
  destroy(id: string, err?: Error) {
    const log = this.tracerMap.get(id);
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
    return this.tracerMap.delete(id);
  }
}
