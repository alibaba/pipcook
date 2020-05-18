export interface Config {
  dependencies: string[];
  pipcookLogName: string;
  optionalNpmClients: string[];
}

export type JobOperation = 'run' | 'list' | 'log';
export type PipelineOperation = 'list' | 'create' | 'update' | 'delete';
