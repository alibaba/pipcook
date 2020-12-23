import { pipelinePromisify } from '../utils';
import { TraceService } from '../services';
import { service, inject } from '@loopback/core';
import {
	RequestContext, RestBindings, get, param
} from '@loopback/rest';
import SseStream from 'ssestream';
import Debug from 'debug';

const debug = Debug('daemon.controller.base');

export class BaseEventController {

  @inject(RestBindings.Http.CONTEXT)
	public ctx: RequestContext;

  constructor(
    @service(TraceService)
    public traceService: TraceService
  ) {
  }

	/**
   * trace event
   */
  @get('/event/{traceId}')
  public async event(@param.path.string('traceId') traceId: string): Promise<void> {
    const sse = new SseStream(this.ctx.request);
    const tracer = this.traceService.get(traceId);
    if (!tracer) {
      this.ctx.response.status(204).send();
      return;
		}
    const pipelineFutrue = pipelinePromisify(sse, this.ctx.response);
		tracer.listen((data) => {
		  debug(`[trace ${traceId}]`, data.type, data.data);
		  sse.write({ event: data.type, data: data.data });
    });
    await tracer.wait();
    sse.end();
    await pipelineFutrue;
    this.ctx.response.end();
  }
}
