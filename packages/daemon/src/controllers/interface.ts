import {
	model as input,
	property
} from '@loopback/repository';
import { getModelSchemaRef } from '@loopback/rest';
  
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
  