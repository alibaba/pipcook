import { DataAccessor, PipelineMeta, ImageDataSourceMeta, TableDataSourceMeta, DataSourceApi, Sample, Runtime, TaskType, DefaultType } from '@pipcook/pipcook-core';

class DataAccessorImpl<T> implements DataAccessor<T> {
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
    private pipelineConfig: PipelineMeta,
    dataSourceApi: DataSourceApi<T>
  ) {
    this.dataSource = new DataSourceProxy<T>(dataSourceApi);
  }

  // initialize metadata
  async getPipelineMeta(): Promise<PipelineMeta> {
    return this.pipelineConfig;
  }

  getTaskType(): TaskType | undefined {
    return undefined;
  }

  async saveModel(localPath: string): Promise<void> {
    // TODO(feely) implement saveModel
    console.log('save model to ', localPath);
  }
  async readModel(): Promise<string> {
    return '';
  }
}

export default (pipelineConfig: PipelineMeta, dataSourceApi: DataSourceApi): StandaloneImpl => new StandaloneImpl(pipelineConfig, dataSourceApi);
