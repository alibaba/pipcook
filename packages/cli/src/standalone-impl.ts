import {
  SequentialDataAccessor,
  DataAccessor,
  PipelineMeta,
  ImageDataSourceMeta,
  TableDataSourceMeta,
  SequentialDataSourceApi,
  DataSourceApi,
  Sample,
  Runtime,
  TaskType,
  DefaultType,
  ProgressInfo,
  pipelineAsync,
  seedrandom,
  generateId
} from '@pipcook/core';
import * as fs from 'fs-extra';
import * as path from 'path';

export class DataAccessorImpl<T> implements DataAccessor<T> {
  size: number;
  randomIndex: number;
  randomArray: Array<number>;
  constructor(
    private dataAccessor: SequentialDataAccessor<T>
  ) {}
  init(size: number, seed?: string): void {
    this.size = size;
    this.randomIndex = 0;
    this.randomArray = this.createRandom(this.size, seed);
  }
  next(): Promise<Sample<T> | null> {
    return this.dataAccessor.next();
  }
  nextBatch(batchSize: number): Promise<Array<Sample<T>> | null> {
    return this.dataAccessor.nextBatch(batchSize);
  }
  nextRandom(): Promise<Sample<T> | null> {
    if ( this.randomIndex >= this.size ) {
      return null;
    } else {
      this.dataAccessor.seek(this.randomArray[this.randomIndex++]);
      return this.dataAccessor.next();
    }
  }
  async nextBatchRandom(batchSize: number): Promise<Array<Sample<T>> | null> {
    const buffer = [];
    while (batchSize) {
      const nextData = await this.nextRandom();
      if ( !nextData )
        break;
      buffer.push(nextData);
      batchSize--;
    }
    return buffer;
  }
  seek(pos: number): Promise<void> {
    return this.dataAccessor.seek(pos);
  }
  createRandom(size: number, seed?: string): Array<number> {
    const rng = seedrandom( seed || generateId() );
    if (size === 0)
      return [];
    let i = 0;
    let index = 0;
    const arr: Array<number | never> = [];
    for ( i = 0; i < size; i++ ) {
      arr[ i ] = i;
    }
    for ( i = 0; i < size; i++ ) {
      index = Math.floor( rng() * (size - i) ) + i;
      if ( index !== i ) {
        [ arr[ i ], arr[ index ] ] = [ arr[ index ], arr[ i ] ];
      }
    }
    return arr;
  }
  async resetRandom(randomSeed?: string): Promise<void> {
    this.randomIndex = 0;
    this.randomArray = this.createRandom(this.size, randomSeed);
    return;
  }
}

class DataSourceProxy<T> implements DataSourceApi<T> {
  public test: DataAccessorImpl<T>;
  public train: DataAccessorImpl<T>;
  public validation: DataAccessorImpl<T>;
  constructor(
    private datasource: SequentialDataSourceApi<T>
  ) {
    this.test = new DataAccessorImpl(datasource.test);
    this.train = new DataAccessorImpl(datasource.train);
    this.validation = new DataAccessorImpl(datasource.validation);
  }
  async init(): Promise<void> {
    const dataSourceMeta = await this.getDataSourceMeta();
    this.test.init(dataSourceMeta.size.test);
    this.train.init(dataSourceMeta.size.train);
    this.evaluate.init(dataSourceMeta.size.evaluate);
  }
  getDataSourceMeta(): Promise<TableDataSourceMeta | ImageDataSourceMeta> {
    return this.datasource.getDataSourceMeta();
  }
}

export class StandaloneImpl<T extends Record<string, any> = DefaultType> implements Runtime<T> {
  public dataSource: DataSourceProxy<T>;

  constructor(
    dataSourceApi: SequentialDataSourceApi<T>,
    private pipelineConfig: PipelineMeta,
    private modelDir: string
  ) {
    this.dataSource = new DataSourceProxy<T>(dataSourceApi);
  }

  async init(): Promise<void> {
    await this.dataSource.init();
  }

  // initialize metadata
  async pipelineMeta(): Promise<PipelineMeta> {
    return this.pipelineConfig;
  }

  taskType(): TaskType | undefined {
    return TaskType.All;
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

export const createStandaloneRT = async (
  dataSourceApi: SequentialDataSourceApi,
  pipelineConfig: PipelineMeta,
  modelDir: string
): Promise<Runtime> => {
  const standaloneImpl = new StandaloneImpl(dataSourceApi, pipelineConfig, modelDir);
  await standaloneImpl.init();
  return standaloneImpl;
};
