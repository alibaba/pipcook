# Developer Guide

## Repository

All source code is open-source and hosted at [GitHub](https://github.com/alibaba/pipcook).

## Environment

- operating system: macOS/Linux
- Node.js >= 12

## Development

### Initialize

Clong the repository from GitHub:

```bash
$ git clone git@github.com:alibaba/pipcook.git
```

### Build

And install the requirements and build:

```bash
$ npm install
$ npm run build
```

We provide a way to use [tuna mirror](https://mirrors.tuna.tsinghua.edu.cn/) for downloading Python and packages:

```sh
$ export BOA_CONDA_MIRROR=https://mirrors.tuna.tsinghua.edu.cn/anaconda/miniconda # this is for miniconda
$ export BOA_CONDA_INDEX=https://pypi.tuna.tsinghua.edu.cn/simple                 # this is for pip
$ npm install
```

### Test

Run all the tests in the following

```bash
$ npm test
```

And run tests for single specific package:

```bash
$ ./node_modules/.bin/lerna run --scope <package_name>
```

### Pipeline

```bash
$ sh run_pipeline.sh <pipeline_name>
```

The `pipeline_name` is the name of the pipeline file under "test/pipelines", such as:

- "text-bayes-classification"
- "mnist-image-classification"
- "databinding-image-classification"

## Plugin Specifications

You can refer [here](../spec/plugin.md) for Plugin Specification.

We have defined a set of interfaces for each plugin. Each type of plugin must be implemented strictly according to the interfaces. The detailed information is as follows:

- [Data Collect](../spec/plugin/0-data-collect.md)
- [Data Access](../spec/plugin/1-data-access.md)
- [Data Process](../spec/plugin/2-data-process.md)
- [Model Load](../spec/plugin/3-model-define.md)
- [Model Train](../spec/plugin/4-model-train.md)
- [Model Evaluate](../spec/plugin/5-model-evaluate.md)

## Dataset Specification

For data reading and processing involved in development, please refer to our [Dataset Specification](../spec/dataset.md).
