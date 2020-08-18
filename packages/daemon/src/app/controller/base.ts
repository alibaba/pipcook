import { inject, Context } from 'midway';
import { ObjectSchema } from 'joi';
import * as HttpStatus from 'http-status';
import { ServerSentEmitter } from '../../utils';
import { LogManager } from '../../service/log-manager';

export class BaseController {
  @inject()
  ctx: Context;
  /**
   * validata the data by schema
   * @param schema the schema
   * @param data the data validated
   */
  validate(schema: ObjectSchema, data: any) {
    const { error } = schema.validate(data);
    if (error) {
      this.ctx.throw(HttpStatus.BAD_REQUEST, error.message);
    }
  }
}

export class BaseEventController extends BaseController {
  @inject('logManager')
  logManager: LogManager;

  private linkLog(logStream: NodeJS.ReadStream, level: 'info' | 'warn', sse: ServerSentEmitter): Promise<void> {
    return new Promise(resolve => {
      logStream.on('data', data => {
        sse.emit('log', { level, data });
      });
      logStream.on('close', resolve);
      logStream.on('error', err => {
        sse.emit('error', err.message);
      });
    });
  }

  /**
   * trace event
   */
  public async traceEventImpl(): Promise<void> {
    const sse = new ServerSentEmitter(this.ctx);
    const log = this.logManager.get(this.ctx.params.traceId);
    if (!log) {
      return sse.finish();
    }
    await Promise.all([
      this.linkLog(log.stdout, 'info', sse),
      this.linkLog(log.stderr, 'warn', sse)
    ]);
    return sse.finish();
  }
}
