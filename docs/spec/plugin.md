# Plugin Specification

[Pipcook][] uses plugins to achieve tasks in a specific machine learning lifecycle, which ensures that the framework is simple, stable, and efficient enough.

At the same time, through a set of plugin specifications defined by [Pipcook][], we can also allow anyone to develop plugins, which ensures the scalability of [Pipcook][]. Theoretically, through plugins, we can achieve all kinds of the machine learning task.

## Plugin Package

[Pipcook][] uses the form of NPM as a plugin package. Besides, we have expanded the protocol that belongs to the [Pipcook Plugin][] based on NPM package.json.

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
- adding the `@pipcook/pipcook-core` to `dependencies` is required, which contains the unusual types for creating a plugin handler.
- adding a root field `pipcook`,
  - `pipcook.category` is used to describe the category to which the plugin belongs, and all categories are listed [here](#plugin-category).
  - `pipcook.datatype` is used to describe the type of data to be processed, currently supports: `common`, `image`, and `text`.
  - `pipcook.params` is used to describe the parameters for the plugin, see the following section for more details.
- adding an optional field `conda` for configuring Python-related dependencies,
  - `conda.python` is used to specify the Python version, must be `3.7`.
  - `conda.dependencies` is used to list all Python dependencies which will be installed on plugin initialization, and it supports the following kinds of version string:
    - `x.y.z`, the specific version on [PyPI][].
    - `*`, the same to above with the latest version.
    - `git+https://github.com/foobar/project@master`, install from GitHub repository, it follows [pip-install(1)](https://pip.pypa.io/en/stable/reference/pip_install/#git).

#### how to define `pipcook.params`?

The `pipcook.params` is an array slot to declare the plugin parameters, then developer could define some parameters for plugin. And Pipcook will use these declarations:

- generate plugin documentation.
- generate plugin configuration UI, for example [imgcook/pipboard](https://github.com/imgcook/pipboard).

An example of params element is like:

```json
{
  "name": "foobar",
  "type": "string",
  "description": "foobar is a string"
}
```

The main fields for an element are:

- `name` it's the parameter name.
- `type` it's the parameter type, it consists literal type and array-like type.
  - literal type is: `string` and `number`
  - array-like type supports appending `[]` or `[n]` after any literal type, for example `string[]` is to represent a string array, and `number[2]` is a number array with 2 elements.
- `description` it describes the parameter.
- `defaultValue` it's the default value, its valid value is corresponding to its type.
- `options` it's used to list options for the parameter value, it could be applied to array-like types only.

Next, let's take a look at some examples in real-world.

To declare a url for a data-collect plugin:

```json
{
  "name": "url",
  "type": "string",
  "description": "the remote url to download your dataset"
}

To declare a shape for an image-resizing plugin:

```json
{
  "name": "resize",
  "type": "number[2]",
  "description": "the shape to resize"
}
```

To declare the loss function to be used in a model plugin:

```json
{
  "name": "loss",
  "type": "string[]",
  "options": [
    "meanSquaredError",
    "meanAbsoluteError",
    "categoricalCrossentropy",
    "sparseCategoricalCrossentropy",
    "binaryCrossentropy"
  ],
  "defaultValue": [ "categoricalCrossentropy" ]
}
```

To declare the language mode to a NLP-related plugin:

```json
{
  "name": "mode",
  "type": "string[1]",
  "options": [ "cn", "en" ],
  "defaultValue": "cn",
  "description": "Chinese text classification or English text classification, the value can be en or cn"
}
```

## Plugin Category

We have defined the following plugin categories for the machine learning lifecycle.

- [`dataCollect(args: ArgsType): Promise<void>`][] downloads from data source, which is stored in corresponding unified dataset.
- [`dataAccess(args: ArgsType): Promise<UniDataset>`][] gets the dataset ready in loader and compatible with later model.
- [`dataProcess(sample: Sample, md: Metadata, args: ArgsType): Promise<Sample>`][] processes data in row.
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
[`dataProcess(sample: Sample, md: Metadata, args: ArgsType): Promise<Sample>`]: https://alibaba.github.io/pipcook/typedoc/interfaces/dataprocesstype.html
[`modelLoad(data: UniDataset, args: ArgsType): Promise<UniModel>`]: https://alibaba.github.io/pipcook/typedoc/interfaces/modelloadtype.html
[`modelDefine(data: UniDataset, args: ModelDefineArgsType): Promise<UniModel>`]: https://alibaba.github.io/pipcook/typedoc/interfaces/modeldefinetype.html
[`modelTrain(data: UniDataset, model: UniModel, args: ModelTrainArgsType): Promise<UniModel>`]: https://alibaba.github.io/pipcook/typedoc/interfaces/modeltraintype.html
[`modelEvaluate(data: UniDataset, model: UniModel): Promise<EvaluateResult>`]: https://alibaba.github.io/pipcook/typedoc/interfaces/modelevaluatetype.html
