# Plugin Specification

[Pipcook][] uses plugins to achieve tasks in a specific machine learning lifecycle, which ensures that the framework is simple, stable, and efficient enough.

At the same time, through a set of plugin specifications defined by [Pipcook][], we can also allow anyone to develop plugins, which ensures the scalability of [Pipcook][]. Theoretically, through plugins, we can achieve all kinds of machine learning task.

## Plugin Package

[Pipcook][] uses the form of NPM as a plugin package. In addition, we have expanded the protocol that belongs to the [Pipcook Plugin][] based on NPM package.json.

```json
{
  "name": "my-own-pipcook-plugin",
  "version": "1.0.0",
  "description": "my own pipcook plugin",
  "dependencies": {
    "@pipcook/pipcook-core": "^0.5.0"
  },
  "pipcook": {
    "category": "dataCollect",
    "datatype": "image"
  },
  "conda": {
    "python": "3.7",
    "dependencies": {
      "tensorflow": "2.2.0"
    }
  }
}
```

After reading the `package.json` example above, there are a few requirements:

- plugin package must be written in TypeScript, and compile it to JavaScript before publishing.
- adding the `@pipcook/pipcook-core` to `dependencies` is required, which contains the unusal types for creating plugin handler.
- adding a root field `pipcook`,
  - `pipcook.category` is used to describe the category to which the plugin belongs, and all categories is listed [here](#plugin-category).
  - `pipcook.datatype` is used to describe the type of data to be processed, currently supports: `common`, `image` and `text`.
- adding an optional field `conda` for configuring Python-related dependencies,
  - `conda.python` is used to specify the Python version, must be `3.7`.
  - `conda.dependencies` is used to list all Python dependencies which will be installed on plugin initialization, and it supports the following kinds of version string:
    - `x.y.z`, the specific version on [PyPI][].
    - `*`, the same to above with the latest version.
    - `git+https://github.com/foobar/project@master`, install from GitHub repository, it follows [pip-install(1)](https://pip.pypa.io/en/stable/reference/pip_install/#git).

## Plugin Category

We have defined the following plugin categories for machine learning lifecycle.

- [`dataCollect(args: ArgsType): Promise<void>`][] downloads from data source, which is stored in corresponding unified dataset.
- [`dataAccess(args: ArgsType): Promise<UniDataset>`][] gets the dataset ready in loader and compatible with later model.
- [`dataProcess(sample: Sample, md: Metadata, args: ArgsType): Promise<void>`][] processes data in row.
- [`modelLoad(data: UniDataset, args: ArgsType): Promise<UniModel>`][] loads the model into the pipeline.
- [`modelDefine(data: UniDataset, args: ModelDefineArgsType): Promise<UniModel>`][] defines the model.
- [`modelTrain(data: UniDataset, model: UniModel, args: ModelTrainArgsType): Promise<UniModel>`][] outputs the trained model and saves to configured location.
- [`modelEvaluate(data: UniDataset, model: UniModel): Promise<EvaluateResult>`][] calls to corresponding evaluators to view how does the trained model perform.

## Developing

Check [this contributing documentation](../contributing/contribute-a-plugin.md) for learning how to develop a new plugin.

[Pipcook]: https://github.com/alibaba/pipcook
[Pipcook Plugin]: ../../GLOSSORY.md#pipcook-plugin
[Pipcook Tools]: ../../manual/pipcook-tools.md
[PyPI]: https://pypi.org

[`dataCollect(args: ArgsType): Promise<void>`]: https://alibaba.github.io/pipcook/typedoc/interfaces/datacollecttype.html
[`dataAccess(args: ArgsType): Promise<UniDataset>`]: https://alibaba.github.io/pipcook/typedoc/interfaces/dataaccesstype.html
[`dataProcess(sample: Sample, md: Metadata, args: ArgsType): Promise<void>`]: https://alibaba.github.io/pipcook/typedoc/interfaces/dataprocesstype.html
[`modelLoad(data: UniDataset, args: ArgsType): Promise<UniModel>`]: https://alibaba.github.io/pipcook/typedoc/interfaces/modelloadtype.html
[`modelDefine(data: UniDataset, args: ModelDefineArgsType): Promise<UniModel>`]: https://alibaba.github.io/pipcook/typedoc/interfaces/modeldefinetype.html
[`modelTrain(data: UniDataset, model: UniModel, args: ModelTrainArgsType): Promise<UniModel>`]: https://alibaba.github.io/pipcook/typedoc/interfaces/modeltraintype.html
[`modelEvaluate(data: UniDataset, model: UniModel): Promise<EvaluateResult>`]: https://alibaba.github.io/pipcook/typedoc/interfaces/modelevaluatetype.html
