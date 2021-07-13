# Script Specification

[Pipcook][] uses scripts to achieve tasks in a specific machine learning lifecycle, which ensures that the framework is simple, stable, and efficient enough.

At the same time, through a set of script specifications defined by [Pipcook][], we can also allow anyone to develop scripts, which ensures the scalability of [Pipcook][]. Theoretically, through scripts, we can achieve all kinds of the machine learning task.


## Script Category

We have defined the following script categories for the machine learning lifecycle.

- datasource: [`DatasourceEntry<SAMPLE, META>: (options: Record<string, any>, context: ScriptContext) => Promise<Dataset<SAMPLE, META>>`](https://alibaba.github.io/pipcook/typedoc/script/index.html#datasourceentry) Download data from data sources and provide data access interfaces.
- dataflow: [`DataflowEntry<IN, META, OUT>: (api: Dataset<IN, META>, options: Record<string, any>, context: ScriptContext) => Promise<Dataset<OUT, META>>`](https://alibaba.github.io/pipcook/typedoc/script/index.html#dataflowentry) Get the data from the datasource, process it and let the next dataflow script or model script get the processed data by returning the data access interface.
- model: [`ModelEntry<SAMPLE, META>: (api: Runtime<SAMPLE, META>, options: Record<string, any>, context: ScriptContext) => Promise<void>`](https://alibaba.github.io/pipcook/typedoc/script/index.html#modelentry) Get sample data from dataflow or datasource scripts, train, validate, and output the model file.

## Developing

Check [this contributing documentation](../contributing/contribute-a-script.md) for learning how to develop a new script.

[Pipcook]: https://github.com/alibaba/pipcook
[Pipcook Script]: ../../GLOSSORY.md#pipcook-script
[Pipcook Tools]: ../../manual/pipcook-tools.md
[PyPI]: https://pypi.org
