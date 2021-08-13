# Script Specification

[Pipcook][] uses scripts to achieve tasks in a specific machine learning lifecycle, which ensures that the framework is simple, stable, and efficient enough.

At the same time, through a set of script specifications defined by [Pipcook][], we can also allow anyone to develop scripts, which ensures the scalability of [Pipcook][]. Theoretically, through scripts, we can achieve all kinds of the machine learning task.


## Script Category

We have defined the following script categories for the machine learning lifecycle.

- datasource: [`DatasourceEntry<SAMPLE, META>: (options: Record<string, any>, context: ScriptContext) => Promise<DatasetPool<SAMPLE, META>>`](https://alibaba.github.io/pipcook/typedoc/script/index.html#datasourceentry) Download data from data sources and provide data access interfaces.
- dataflow: [`DataflowEntry<IN, IN_META, OUT, OUT_META>: (api: DatasetPool<IN, IN_META>, options: Record<string, any>, context: ScriptContext) => Promise<DatasetPool<OUT, OUT_META>>`](https://alibaba.github.io/pipcook/typedoc/script/index.html#dataflowentry) Get the data from the datasource, process it and let the next dataflow script or model script get the processed data by returning the data access interface.
- model: [`{ train: ModelEntry<SAMPLE, META>, predict: PredictEntry<SAMPLE, META> }`](https://alibaba.github.io/pipcook/typedoc/script/interfaces/extmodelentry.html) Get sample data from dataflow or datasource scripts, train, validate, and output the model file. And predict from the input.

## Developing

Check [this contributing documentation](../contributing/contribute-a-script.md) for learning how to develop a new script.

[Pipcook]: https://github.com/alibaba/pipcook
[Pipcook Script]: ../../GLOSSORY.md#pipcook-script
[Pipcook Tools]: ../../manual/pipcook-tools.md
[PyPI]: https://pypi.org
