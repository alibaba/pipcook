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
  private stdout: LogPassthrough;
  // stderr stream for log pipe
  private stderr: LogPassthrough;
  // event emitter
  private emitter: EventEmitter;

  private opts?: LogOptions;
  private fdOut: number;
  private fdErr: number;
  constructor(opts?: LogOptions) {
    this.id = generateId();
    this.emitter = new EventEmitter();
    this.opts = opts;
  }

  /**
   * init loggers
   */
  async initLogger() {
    this.fdOut = this.opts?.stdoutFile ? await open(this.opts?.stdoutFile, 'w+') : -1;
    this.fdErr = this.opts?.stderrFile ? await open(this.opts?.stderrFile, 'w+') : -1;
    this.stdout = new LogPassthrough(this.fdOut);
    this.stderr = new LogPassthrough(this.fdErr);
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

  /**
   * destory tracer
   * @param err error if have
   */
  destroy(err?: Error) {
    if (err) {
      // make sure someone handles the error, otherwise the process will exit
      if (this.stderr.listeners('error').length > 0) {
        this.stderr.destroy(err);
      } else {
        console.error(`unhandled error from log: ${err.message}`);
        this.stderr.destroy();
      }
    } else {
      this.stderr.destroy();
    }
    this.stdout.destroy();
    if (this.fdOut > 0) {
      close(this.fdOut);
    }
    if (this.fdErr > 0) {
      close(this.fdErr);
    }
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
    const tracer: Tracer = new Tracer(opts);
    await tracer.initLogger();
    this.tracerMap.set(tracer.id, tracer);
    return tracer;
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
    tracer.destroy(err);
    return this.tracerMap.delete(id);
  }
}
