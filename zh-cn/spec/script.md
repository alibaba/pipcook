# 脚本规范

[Pipcook][] 使用脚本来完成特定机器学习任务的任务，它使得框架足够简单、稳定和高效。

同时，通过定义了不同的脚本规范，使得我们可以允许任何人开发插件来拓展 [Pipcook][]，理论上，我们可以通过脚本来完成任何的机器学习任务。


## 分类

下面是所有在 Pipcook 中支持的脚本分类。

- datasource: [`DatasourceEntry<SAMPLE, META>: (options: Record<string, any>, context: ScriptContext) => Promise<DatasetPool<SAMPLE, META>>`](https://alibaba.github.io/pipcook/typedoc/script/index.html#datasourceentry) 从数据源中下载数据，提供数据访问接口。
- dataflow: [`DataflowEntry<IN, IN_META, OUT, OUT_META>: (api: DatasetPool<IN, IN_META>, options: Record<string, any>, context: ScriptContext) => Promise<DatasetPool<OUT, OUT_META>>`](https://alibaba.github.io/pipcook/typedoc/script/index.html#dataflowentry) 从 datasource 获取数据，处理并通过返回数据访问接口让下一个 dataflow 脚本或 model 脚本获取处理后的数据。
- model: [`{ train: ModelEntry<SAMPLE, META>, predict: PredictEntry<SAMPLE, META> }`](https://alibaba.github.io/pipcook/typedoc/script/interfaces/extmodelentry.html) 从 dataflow 或 datasource 脚本中获取样本数据，并进行训练，验证，产出模型。或者从输入的数据进行预测。

## 开发

查看[贡献者文档](../contributing/contribute-a-script.md)来学习如何开发一个新的脚本。

[Pipcook]: https://github.com/alibaba/pipcook
[Pipcook Script]: ../GLOSSORY.md#pipcook-script
[PyPI]: https://pypi.org

[`dataCollect(args: ArgsType): Promise<void>`]: https://alibaba.github.io/pipcook/typedoc/interfaces/datacollecttype.html
[`dataAccess(args: ArgsType): Promise<UniDataset>`]: https://alibaba.github.io/pipcook/typedoc/interfaces/dataaccesstype.html
[`dataProcess(sample: Sample, md: Metadata, args: ArgsType): Promise<Sample>`]: https://alibaba.github.io/pipcook/typedoc/interfaces/dataprocesstype.html
[`modelLoad(data: UniDataset, args: ArgsType): Promise<UniModel>`]: https://alibaba.github.io/pipcook/typedoc/interfaces/modelloadtype.html
[`modelDefine(data: UniDataset, args: ModelDefineArgsType): Promise<UniModel>`]: https://alibaba.github.io/pipcook/typedoc/interfaces/modeldefinetype.html
[`modelTrain(data: UniDataset, model: UniModel, args: ModelTrainArgsType): Promise<UniModel>`]: https://alibaba.github.io/pipcook/typedoc/interfaces/modeltraintype.html
[`modelEvaluate(data: UniDataset, model: UniModel): Promise<EvaluateResult>`]: https://alibaba.github.io/pipcook/typedoc/interfaces/modelevaluatetype.html
