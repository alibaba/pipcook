import { Transform, TransformCallback } from 'stream';
import { EventEmitter } from 'events';
import { open, close, write } from 'fs-extra';
import { provide, scope, ScopeEnum } from 'midway';
import { StringDecoder } from 'string_decoder';
import { generateId, PipelineStatus, PluginTypeI } from '@pipcook/pipcook-core';
import Debug from 'debug';

const debug = Debug('daemon.service.tracer');

export type TraceType = 'log' | 'job_status';

/**
 * base pipcook event, defined the fields `type` and `data`
 */
export class TraceEvent {
  data?: any;
  constructor(public type: TraceType) {}
}

/**
 * pipcook event data type for job status change
 */
export class JobStatusChangeEvent extends TraceEvent {
  data: {
    jobStatus: PipelineStatus;
    step?: PluginTypeI;
    stepAction?: 'start' | 'end';
    queueLength?: number;
  };
  constructor(jobStatus: PipelineStatus, step?: PluginTypeI, stepAction?: 'start' | 'end', queueLength?: number) {
    super('job_status');
    this.data = { jobStatus, step, stepAction, queueLength };
  }
}

export type LogLevel = 'info' | 'warn' | 'error';
/**
 * pipcook event data type for log
 */
export class LogEvent extends TraceEvent {
  data: {
    level: LogLevel;
    data: string;
  };
  constructor(level: LogLevel, data: string) {
    super('log');
    this.data = { level, data };
  }
}

export type PipecookEvent = JobStatusChangeEvent | LogEvent;
/**
 * trace handler
 * it has 2 parts: logger and event handler:
 * logger:
 * stdout and stderr, they are streams to pipe the logs to clients
 * event handler:
 * pipe the pipcook event to clients
 */
export class Tracer {
  // trace id
  id: string;
  // stdout stream for log pipe
  private stdout: LogPassthrough;
  // stderr stream for log pipe
  private stderr: LogPassthrough;
  // event emitter for pipcook event
  private emitter: EventEmitter;
  // options of tracer
  private opts?: TraceOptions;
  // log file fd for stdout, -1 if not defined
  private fdOut: number;
  // log file fd for stderr, -1 if not defined
  private fdErr: number;

  constructor(opts?: TraceOptions) {
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
  listen(cb: (data: PipecookEvent) => void): void {
    // event callback
    this.emitter.on('trace-event', (e) => {
      cb(e);
    });

    // log callback
    const pipeLog = (level: LogLevel, logger: LogPassthrough) => {
      logger.on('data', data => {
        cb(new LogEvent(level, data));
      });
      logger.on('close', () => this.emitter.emit('trace-finished'));
      logger.on('error', err => {
        cb(new LogEvent('error', err.message));
      });
    };
    pipeLog('info', this.stdout);
    pipeLog('warn', this.stderr);
  }

  /**
   * emit event to client
   * @param event pipcook event data
   */
  emit(event: PipecookEvent) {
    this.emitter.emit('trace-event', event);
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
      // TODO(feely): emit the error by tracer not logger
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

export interface TraceOptions {
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
  async create(opts?: TraceOptions): Promise<Tracer> {
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
    if (tracer) {
      tracer.destroy(err);
      return this.tracerMap.delete(id);
    } else {
      debug(`tracer ${id} not found for destroy`);
    }
  }
}
