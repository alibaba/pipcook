import { SequentialDataSourceApi, ScriptContext, Sample, DataFlowEntry, DataSourceMeta, SequentialDataAccessor } from '../types/runtime';

/**
 * function which process a sample
 */
export type SampleProcessor<P=any, T=P> = (sample: Sample<P> | null, options: Record<string, any>, context: ScriptContext) => Promise<Sample<T>>;
/**
 * function which process metadata
 */
export type MetaProcessor = (api: SequentialDataSourceApi, options: Record<string, any>, context: ScriptContext) => Promise<DataSourceMeta>;

/**
 * generate the data flow entry, handle most of the general logic
 * @param sampleProcessor sample processor
 */
export const generateDataFlow = function<T> (sampleProcessor: SampleProcessor, metaProcessor: MetaProcessor): DataFlowEntry<T> {
  const sampleBatchProcessor = async (samples: Array<Sample> | null, options: Record<string, any>, context: ScriptContext): Promise<Array<Sample> | null> => {
    return samples ? Promise.all(samples.map((sample) => sampleProcessor(sample, options, context))) : null;
  };
  const createDataAccessor = (dataAccessor: SequentialDataAccessor, options: Record<string, any>, context: ScriptContext): SequentialDataAccessor => {
    return {
      next: () => dataAccessor.next().then((sample) => sampleProcessor(sample, options, context)),
      nextBatch: (numOfBatch: number) => dataAccessor.nextBatch(numOfBatch).then((samples) => sampleBatchProcessor(samples, options, context)),
      seek: dataAccessor.seek
    };
  };
  return async (dataSource: SequentialDataSourceApi, options: Record<string, any>, context: ScriptContext): Promise<SequentialDataSourceApi> => {
    return {
      train: createDataAccessor(dataSource.train, options, context),
      test: createDataAccessor(dataSource.test, options, context),
      evaluate: dataSource.evaluate ? createDataAccessor(dataSource.evaluate, options, context) : undefined,
      getDataSourceMeta: () => {
        return metaProcessor(dataSource, options, context);
      }
    };
  };
};
