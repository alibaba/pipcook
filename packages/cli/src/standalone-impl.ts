import {
  DataAccessor,
  PipelineMeta,
  ImageDataSourceMeta,
  TableDataSourceMeta,
  DataSourceApi,
  Sample,
  Runtime,
  TaskType,
  DefaultType,
  ProgressInfo,
  pipelineAsync
} from '@pipcook/pipcook-core';
import * as fs from 'fs-extra';
import * as path from 'path';
export class DataAccessorImpl<T> implements DataAccessor<T> {
  constructor(
    private dataAccessor: DataAccessor<T>
  ) {}
  next(): Promise<Sample<T> | null> {
    return this.dataAccessor.next();
  }
  nextBatch(batchSize: number): Promise<Array<Sample<T>> | null> {
    return this.dataAccessor.nextBatch(batchSize);
  }
  seek(pos: number): Promise<void> {
    return this.dataAccessor.seek(pos);
  }
}

class DataSourceProxy<T> implements DataSourceApi<T> {
  public test: DataAccessor<T>;
  public train: DataAccessor<T>;
  public evaluate: DataAccessor<T>;
  constructor(
    private datasource: DataSourceApi<T>
  ) {
    this.test = new DataAccessorImpl(datasource.test);
    this.train = new DataAccessorImpl(datasource.train);
    this.evaluate = new DataAccessorImpl(datasource.evaluate);
  }
  getDataSourceMeta(): Promise<TableDataSourceMeta | ImageDataSourceMeta> {
    return this.datasource.getDataSourceMeta();
  }
}

export class StandaloneImpl<T extends Record<string, any> = DefaultType> implements Runtime<T> {
  public dataSource: DataSourceProxy<T>;

  constructor(
    dataSourceApi: DataSourceApi<T>,
    private pipelineConfig: PipelineMeta,
    private modelDir: string
  ) {
    this.dataSource = new DataSourceProxy<T>(dataSourceApi);
  }

  // initialize metadata
  async pipelineMeta(): Promise<PipelineMeta> {
    return this.pipelineConfig;
  }

  taskType(): TaskType | undefined {
    return undefined;
  }

  async notifyProgress(progress: ProgressInfo): Promise<void> {
    console.log(`progress: ${progress.progressValue}%`);
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
  dataSourceApi: DataSourceApi,
  pipelineConfig: PipelineMeta,
  modelDir: string
): StandaloneImpl => {
  return new StandaloneImpl(dataSourceApi, pipelineConfig, modelDir);
};
