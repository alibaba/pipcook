import * as nlp from '../apis/nlp';
import * as vision from '../apis/vision';
import { pseudoRandomBytes } from 'crypto';

type PipelineGenApis = Record<string, Function>;
type PipelineNode = {
  id?: string;
  config: any;
  namespace: {
    module: 'vision' | 'nlp';
    method: string;
  };
};

export class PipelineGenContext {
  pipelines: PipelineNode[] = [];
}

export function nlpGen(ctx: PipelineGenContext): PipelineGenApis {
  return Object.keys(nlp).reduce((gen, name) => {
    gen[name] = () => {
      const pipeline = {
        id: pseudoRandomBytes(8).toString('hex'),
        config: require(`${__dirname}/pipelines/nlp-${name}.base.json`),
        namespace: {
          module: 'nlp',
          method: name
        }
      } as PipelineNode;
      ctx.pipelines.push(pipeline);
    };
    return gen;
  }, {} as PipelineGenApis);
}

export function visionGen(ctx: PipelineGenContext): PipelineGenApis {
  return Object.keys(vision).reduce((gen, name) => {
    gen[name] = () => {
      const pipeline = {
        id: pseudoRandomBytes(8).toString('hex'),
        config: require(`${__dirname}/pipelines/vision-${name}.base.json`),
        namespace: {
          module: 'vision',
          method: name
        }
      } as PipelineNode;
      ctx.pipelines.push(pipeline);
    };
    return gen;
  }, {} as PipelineGenApis);
}
