import { ProgressInfo } from '@pipcook/core';
import { pipelineAsync } from './utils';
import { DefaultDataSource, DefaultRuntime, PipelineMeta } from '@pipcook/costa';
import * as fs from 'fs-extra';
import * as path from 'path';

export class StandaloneImpl implements DefaultRuntime {
  constructor(
    public dataSource: DefaultDataSource,
    private modelDir: string
  ) {}

  async notifyProgress(progress: ProgressInfo): Promise<void> {
    console.log(`progress: ${progress.value}%`);
  }

  async saveModel(localPathOrStream: string | NodeJS.ReadableStream, filename: 'model'): Promise<void> {
    if (typeof localPathOrStream === 'string') {
      if (path.parse(localPathOrStream).dir === this.modelDir || this.modelDir === path.resolve(localPathOrStream)) {
        return;
      }
      return fs.copy(localPathOrStream, this.modelDir);
    } else {
      const modelStream = fs.createWriteStream(path.join(this.modelDir, filename));
      return pipelineAsync(localPathOrStream, modelStream);
    }
  }

  async readModel(): Promise<string> {
    return this.modelDir;
  }
}

export const createStandaloneRT = (
  dataSourceApi: DefaultDataSource,
  modelDir: string
): DefaultRuntime => {
  return new StandaloneImpl(dataSourceApi, modelDir);
};
