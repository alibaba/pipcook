import { inject, Context } from 'midway';
import { ObjectSchema } from 'joi';
import * as HttpStatus from 'http-status';
import { ServerSentEmitter } from '../../utils';
import { TraceManager } from '../../service/trace-manager';
import Debug from 'debug';

const debug = Debug('daemon.controller.base');

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
  @inject('traceManager')
  traceManager: TraceManager;

  /**
   * trace event
   */
  public async traceEventImpl(): Promise<void> {
    const sse = new ServerSentEmitter(this.ctx);
    const tracer = this.traceManager.get(this.ctx.params.traceId);
    if (!tracer) {
      return sse.finish();
    }
    tracer.listen((data) => {
      debug(`[trace ${this.ctx.params.traceId}]`, data.type, data.data);
      sse.emit(data.type, data.data);
    });
    await tracer.wait();
    return sse.finish();
  }
}
