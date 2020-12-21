import { ServerSentEmitter } from '../utils';
import { TraceService } from '../services';
import { service, inject } from '@loopback/core';
import {
	RequestContext, RestBindings, get, param
} from '@loopback/rest';
import Debug from 'debug';

const debug = Debug('daemon.controller.base');

export class BaseEventController {
	@inject(RestBindings.Http.CONTEXT)
	public ctx: RequestContext;
	
	constructor(
    @service(TraceService)
	  public traceService: TraceService
  ) {	}

	/**
   * trace event
   */
  @get('/event/{traceId}')
  public async event(@param.path.string('traceId') traceId: string): Promise<void> {
    const sse = new ServerSentEmitter(this.ctx);
		const tracer = this.traceService.get(traceId);
		if (!tracer) {
		  return sse.finish();
		}
		tracer.listen((data) => {
		  debug(`[trace ${traceId}]`, data.type, data.data);
		  sse.emit(data.type, data.data);
		});
		await tracer.wait();
		return sse.finish();
  }
}
