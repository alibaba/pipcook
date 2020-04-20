# Developer Guide

## Repository

All source code is open-source and hosted at [GitHub](https://github.com/alibaba/pipcook).

## Environment

- Operating system: MacOs, Linux
- Running environment: Node. js> = 10.16, Npm> = 6.1.0
- Python requirements (python> = 3.6, pip points to the correct python3 path)
- Global npm package: lerna, typescript compiler

To check whether the above environment is installed correctly, run the following command:

```sh
$ node -v
$ npm -v
$ tsc -v
$ lerna -v
$ python --version
$ pip --version
```

## Plugin Specifications

You can refer [here](../spec/plugin.md) for Plugin Specification.

We have defined a set of interfaces for each plugin. Each type of plugin must be implemented strictly according to the interfaces. The detailed information is as follows:

- [Data Collect](../spec/plugin/0-data-collect.md)
- [Data Access](../spec/plugin/1-data-access.md)
- [Data Process](../spec/plugin/2-data-process.md)
- [Model Load](../spec/plugin/3-model-define.md)
- [Model Train](../spec/plugin/4-model-train.md)
- [Model Evaluate](../spec/plugin/5-model-evaluate.md)
- [Model Deploy](../spec/plugin/6-model-deploy.md)

## Dataset Specification

For data reading and processing involved in development, please refer to our [Dataset Specification](../spec/dataset.md).
