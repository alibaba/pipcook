import { model, property } from '@loopback/repository';
import { PluginPackage } from '@pipcook/costa';
import { Transform, TransformCallback } from 'stream';
import { EventEmitter } from 'events';
import { WriteStream, createWriteStream } from 'fs-extra';
import { StringDecoder } from 'string_decoder';
import { generateId, PipelineStatus, PluginTypeI } from '@pipcook/pipcook-core';
import { Plugin, Pipeline } from '../models';

@model()
export class PluginTraceResp extends Plugin {
  @property({ type: 'string' })
  public traceId: string;

  constructor(data?: Partial<PluginTraceResp>) {
    super(data);
  }
}

@model()
export class PipelineTraceResp extends Pipeline {
  @property({ type: 'string' })
  public traceId: string;

  constructor(data?: Partial<PipelineTraceResp>) {
    super(data);
  }
}

export interface GenerateOptions {
  pipeline: Pipeline;
  plugins: {
    modelDefine: PluginPackage;
    dataProcess?: PluginPackage;
    datasetProcess?: PluginPackage;
  };
  modelPath: string;
  workingDir: string;
  template: string;
}


export type TraceType = 'log' | 'job_status';

/**
 * base pipcook event, defined the fields `type` and `data`
 */
export class TraceEvent {
  data?: Record<string, unknown>;
  constructor(public type: TraceType) { }
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

type LogLevel = 'info' | 'warn' | 'error';
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

export type PipcookEvent = JobStatusChangeEvent | LogEvent;

export interface TraceOptions {
  stdoutFile?: string;
  stderrFile?: string;
}

export class LogPassthrough extends Transform {
  decoder = new StringDecoder('utf8');
  last: string | undefined;
  fileStream: WriteStream;

  constructor(filename?: string) {
    super({ objectMode: true });
    if (filename) {
      this.fileStream = createWriteStream(filename, { flags: 'w+' });
      this.fileStream.on('error', (err) => {
        console.error(`log [${filename}] write error: ${err.message}`);
      });
    }
  }

  _transform(chunk: any, encoding: string, callback: TransformCallback): void {
    if (this.last === undefined) {
      this.last = '';
    }
    this.last += this.decoder.write(chunk);
    const list = this.last.split(/\n|\r/);
    this.last = list.pop();
    list.forEach((line) => {
      this.push(line);
    });
    callback();
  }

  _flush(callback: TransformCallback): void {
    this.last = this.last ? this.last + this.decoder.end() : this.decoder.end();
    if (this.last) {
      this.push(this.last);
    }
    callback();
  }

  /**
   * cover Transform.write, otherwise if no `data` event listener,
   * the callback `_transform` will not be called, but we need to save the log to file.
   * @param chunk data to write
   * @param cb callback when done
   */
  write(chunk: any, cb?: (error: Error | null | undefined) => void): boolean;
  /**
   * cover Transform.write, otherwise if no `data` event listener,
   * the callback `_transform` will not be called, but we need to save the log to file.
   * @param chunk data to write
   * @param encoding data encoding
   * @param cb callback when done
   */
  write(chunk: any, encoding?: string, cb?: (error: Error | null | undefined) => void): boolean;
  write(chunk: any, ...args: any[]): boolean {
    if (this.fileStream && this.fileStream.writable) {
      this.fileStream.write(chunk);
    }
    return super.write(chunk, args[0], args[1]);
  }

  writeLine(line: string): void {
    this.write(`${line}\n`);
  }

  /**
   * end and destroy the stream.
   */
  async finish(err?: Error): Promise<void> {
    return new Promise<void>((resolve) => {
      this.end();
      // make sure someone handles the error, otherwise the process will exit
      if (err && this.listeners('error').length > 0) {
        this.destroy(err);
      } else {
        if (err) {
          console.error(`unhandled error from log: ${err.message}`);
        }
        this.destroy();
      }
      if (this.fileStream) {
        this.fileStream.on('close', () => {
          this.fileStream.close();
          resolve();
        });
        this.fileStream.end();
      } else {
        resolve();
      }
    });
  }
}

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
  private dispatcher: EventEmitter;

  constructor(opts?: TraceOptions) {
    this.id = generateId();
    this.dispatcher = new EventEmitter();
    this.stdout = new LogPassthrough(opts?.stdoutFile);
    this.stderr = new LogPassthrough(opts?.stderrFile);
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
  listen(cb: (data: PipcookEvent) => void): void {
    // event callback
    this.dispatcher.on('trace-event', (e) => {
      cb(e);
    });

    // log callback
    const pipeLog = (level: LogLevel, logger: LogPassthrough) => {
      logger.on('data', (data) => {
        cb(new LogEvent(level, data));
      });
      logger.on('close', () => this.dispatcher.emit('trace-finished'));
      logger.on('error', (err) => {
        cb(new LogEvent('error', err.message));
      });
    };
    pipeLog('info', this.stdout);
    pipeLog('warn', this.stderr);
  }

  /**
   * dispatch event to client
   * @param event pipcook event data
   */
  dispatch(event: PipcookEvent): void {
    this.dispatcher.emit('trace-event', event);
  }

  /**
   * wait for end
   */
  async wait(): Promise<void> {
    return new Promise((resolve) => {
      this.dispatcher.on('trace-finished', resolve);
    });
  }

  /**
   * destory tracer
   * @param err error if have
   */
  async destroy(err?: Error): Promise<[void, void]> {
    // TODO(feely): emit the error by tracer not logger
    return Promise.all([
      this.stderr.finish(err),
      this.stdout.finish()
    ]);
  }
}
