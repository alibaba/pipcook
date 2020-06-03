# Contributor Guide

Pipcook is a community-driven open source project. We do our best to hope that every bug fixed, new feature, and how this project evolves is visible and transparent to everyone in this Community.

Therefore, we believe that from source code to our documentation are more friendly to contributors, so in order to make it easier for contributors to participate in Pipcook, some paths have been developed. If you want to get involved, you can follow it.

- If you are going to browse source code only, goto [GitHub](https://github.com/alibaba/pipcook).
- If you are a rookie and no experience in contributing to any open source project, then we have organized [good first issue][] for you, all of which are relatively simple tasks, easy to start with.
- If you want to learn machine learning through contributing this project, you can try our [good first model][] to help us do some model implementation and migration tasks (rest assured, you only need to complete the call to the Python ecosystem through [Boa][]).
- Otherwise, discussions on any of our issues are open to everyone, and you are welcome to contribute your ideas.

## Submit a patch

Next, let ’s take a look at how to submit patches to Pipcook.

### Requirements

- macOS / Linux
- Node.js >= 12

### Download source

Clone the repository from GitHub:

```bash
$ git clone git@github.com:alibaba/pipcook.git
```

### Build from source

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

### Push and create a pull request

After the local test is passed, you can push the code and create a pull request:

```sh
$ git push git@github.com:<username>/pipcook.git <feature_branch>
```

## Internal documentations

### Plugin Specification

You can refer [here](../spec/plugin.md) for Plugin Specification.

We have defined a set of interfaces for each plugin. Each type of plugin must be implemented strictly according to the interfaces. The detailed information is as follows:

- [Data Collect](../spec/plugin/0-data-collect.md)
- [Data Access](../spec/plugin/1-data-access.md)
- [Data Process](../spec/plugin/2-data-process.md)
- [Model Load](../spec/plugin/3-model-define.md)
- [Model Train](../spec/plugin/4-model-train.md)
- [Model Evaluate](../spec/plugin/5-model-evaluate.md)

### Dataset Specification

For data reading and processing involved in the development, please refer to our [Dataset Specification](../spec/dataset.md).

[good first issue]: https://github.com/alibaba/pipcook/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22
[good first model]: https://github.com/alibaba/pipcook/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+model%22
[Boa]: https://github.com/alibaba/pipcook/tree/master/packages/boa
