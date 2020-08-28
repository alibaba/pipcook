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

export interface LogEvent {
  level: string;
  data: string;
}

export type PipecookEvent = JobStatusChangeEvent | LogEvent;
/**
 * tracer for plugin installing and pipeline running.
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

  /**
   * get the loggers
   */
  getLogger(): { stdout: LogPassthrough; stderr: LogPassthrough } {
    return { stdout: this.stdout, stderr: this.stderr };
  }

  /**
   * listen event
   * @param cb event callback
   */
  listen(cb: (type: PipcookEventType, data: PipecookEvent) => void): void {
    // event callback
    this.emitter.on('trace-event', (e) => {
      cb(e.type, e.data);
    });

    // log callback
    const pipeLog = (level: string, logger: LogPassthrough) => {
      logger.on('data', data => {
        cb('log', { level, data });
      });
      logger.on('close', () => this.emitter.emit('trace-finished'));
      logger.on('error', err => {
        cb('log', { level: 'error', data: err.message });
      });
    };
    pipeLog('info', this.stdout);
    pipeLog('warn', this.stdout);
  }

  /**
   * emit event to client
   * @param type event type
   * @param data only JobStatusChangeEvent for now
   */
  emit(type: PipcookEventType, data: JobStatusChangeEvent) {
    this.emitter.emit('trace-event', { type, data });
  }

  /**
   * wait for end
   */
  async wait() {
    return new Promise((resolve) => {
      this.emitter.on('trace-finished', resolve);
    });
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
    const tracer = this.tracerMap.get(id);
    if (err) {
      // make sure someone handles the error, otherwise the process will exit
      if (tracer.stderr.listeners('error').length > 0) {
        tracer.stderr.destroy(err);
      } else {
        console.error(`unhandled error from log: ${err.message}`);
        tracer.stderr.destroy();
      }
    } else {
      tracer.stderr.destroy();
    }
    tracer.stdout.destroy();
    if (tracer.stdout.fd > 0) {
      close(tracer.stdout.fd);
    }
    if (tracer.stderr.fd > 0) {
      close(tracer.stderr.fd);
    }
    return this.tracerMap.delete(id);
  }
}
