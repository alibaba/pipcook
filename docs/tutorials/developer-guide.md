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

- [Data Collect](https://alibaba.github.io/pipcook/doc/DataCollect%20%20Plugin-en)
- [Data Access](https://alibaba.github.io/pipcook/doc/DataAccess%20Plugin-en)
- [Data Process](https://alibaba.github.io/pipcook/doc/DataProcess%20Plugin-en)
- [Model Load](https://alibaba.github.io/pipcook/doc/ModelLoad%20Plugin-en)
- [Model Train](https://alibaba.github.io/pipcook/doc/ModelTrain%20Plugin-en)
- [Model Evaluate](https://alibaba.github.io/pipcook/doc/ModelEvaluate%20Plugin-en)
- [Model Deploy](https://alibaba.github.io/pipcook/doc/ModelDeploy%20Plugin-en)

## Dataset Specification

For data reading and processing involved in development, please refer to our [Dataset Specification](../spec/dataset.md).
