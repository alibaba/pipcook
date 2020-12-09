import { Plugin } from '../models';
import { property } from '@loopback/repository';


export class PluginTraceResp extends Plugin {
	@property({ type: 'string' })
	public traceId: string;

	constructor() {
		super();
	}
}
