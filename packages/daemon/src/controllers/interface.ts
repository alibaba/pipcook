import {
	model as input,
	property
} from '@loopback/repository';
import { getModelSchemaRef } from '@loopback/rest';
import { Job, JobParam } from '../models';
  
@input()
export class PluginInstallPararmers {
	@property({ required: true })
	name: string;
	@property({
		jsonSchema: {
			type: 'string',
			format: 'uri',
			pattern: '^(https?|http?)://',
			minLength: 7,
			maxLength: 255
		}
	})
	pyIndex?: string;
}
@input()
export class JobCreateParameters {
	@property({ required: true })
	pipelineId: string;
	// TODO json validation
	@property()
	params?: JobParam[];
}


@input()
export class GetJobListParameters {
	@property()
	pipelineId: string;
	@property()
	offset: number;
	@property()
	limit: number;
}

export class CreateJobResp extends Job {
	@property()
	traceId: string;

	constructor() {
		super();
	}
}