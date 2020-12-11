import { injectable, BindingScope } from '@loopback/core';
import Debug from 'debug';
import { Tracer, TraceOptions } from './interface';

const debug = Debug('daemon.service.tracer');

@injectable({ scope: BindingScope.SINGLETON })
export class TraceService {
  tracerMap = new Map<string, Tracer>();

  /**
   * create a log object, must call the destroy function to clean it up.
   */
  create(opts?: TraceOptions): Tracer {
    const tracer: Tracer = new Tracer(opts);
    this.tracerMap.set(tracer.id, tracer);
    return tracer;
  }

  /**
   * get the tarcer object by trace id.
   * @param id trace id
   */
  get(id: string): Tracer | undefined {
    return this.tracerMap.get(id);
  }

  /**
   * clean the tracer object up, emit the end event,
   * if the trace progress ends with error, it'll be emitted before end event.
   * @param id trace id
   * @param err error if have
   */
  async destroy(id: string, err?: Error) {
    const tracer = this.tracerMap.get(id);
    if (tracer) {
      this.tracerMap.delete(id);
      return tracer.destroy(err);
    } else {
      debug(`tracer ${id} not found for destroy`);
    }
  }
}
