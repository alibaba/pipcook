import { ts, Node } from 'ts-morph';

export type PipelineNode = {
  id?: string;
  signature: string;
  config: any;
  namespace: {
    module: AppModule;
    method: string;
  };
  jobId?: string;
};

export type AppModule = 'vision' | 'nlp';

export class PipelineGenContext {
  pipelines: PipelineNode[] = [];
  nlpReferences: Node<ts.Node>[] = [];
  visionReferences: Node<ts.Node>[] = [];
}
