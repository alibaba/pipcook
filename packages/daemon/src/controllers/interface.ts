import {
	model as input,
	property
} from '@loopback/repository';
import { getModelSchemaRef } from '@loopback/rest';
import { Job, JobParam, Pipeline, Plugin } from '../models';
import {
  RunConfigI
} from '@pipcook/pipcook-core';
  
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
export class PipelineCreateParameters {
	@property()
	name: string;

	@property()
	config: RunConfigI;

	@property()
	configUri: string;
}

@input()
export class PipelineUpdateParameters {
	@property({ required: true })
	config: RunConfigI;
}

@input()
export class PipelineInstallParameters {
	@property({ required: true })
	pyIndex: string;
}

@input()
export class JobCreateParameters {
	@property({ required: true })
	pipelineId: string;
	// TODO json validation
	@property.array(Object)
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

export class CreatePipelineResp extends Pipeline {
	plugins: Plugin[]
}
