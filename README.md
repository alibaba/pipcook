<p align="center">
  <a href="https://www.npmjs.com/package/@pipcook/pipcook-core"><img alt="npm" src="https://img.shields.io/npm/dm/@pipcook/pipcook-core"></a>
  <a href="https://www.npmjs.com/package/@pipcook/pipcook-core"><img alt="npm" src="https://img.shields.io/npm/v/@pipcook/pipcook-core"></a>
  <a href="https://hub.docker.com/r/pipcook/pipcook"><img alt="Docker Cloud Build Status" src="https://img.shields.io/docker/cloud/build/pipcook/pipcook"></a>
  <a href="https://github.com/alibaba/pipcook"><img alt="GitHub repo size" src="https://img.shields.io/github/repo-size/alibaba/pipcook"></a>
  <a href="https://github.com/alibaba/pipcook"><img src="https://img.shields.io/github/issues/alibaba/pipcook" alt="gzip size"></a>
  <a href="https://opensource.org/licenses/Apache-2.0"> <img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg"></a>
</p>

# pipcook

With the mission of enabling front-end engineers to utilize the power of machine learning without any prerequisites and the vision to lead front-end technical field to the intelligentization, pipcook has become the one-step front-end algorithm platform from processing data to deploying models. Pipcook is focused on the front-end area and developed from the front-end developers' view. With the principle of being friendly for web developers, pipcook will push the whole area forward with the engine of machine learning. We are named 'pipcook' since our platform is based on pip (pipeline) and we also want to include the python ecosystem (python PyPI)

## Documentation

Please refer to [中文](https://alibaba.github.io/pipcook/doc/pipcook%20%E6%98%AF%E4%BB%80%E4%B9%88-zh)｜ [english](https://alibaba.github.io/pipcook/doc/What%20is%20Pipcook%3F-en)

## Quick start

- Environment: Node.js >= 10.16, Npm >= 6.1
- Python: python >= 3.6 with correct pip installed (This is required if you want to use pipcook-python-node.)

We recommend to install pipcook-cli to manage pipcook projects:
```
sudo npm install -g @pipcook/pipcook-cli
```

You can initialize a pipcook project with just a few commands:
```
mkdir pipcook-example && cd pipcook-example
pipcook init
cd pipcook-project
```

## Run your first pipcook pipeline

In the initialized folder, we have prepared several examples for you, some of they are:

- [pipeline-mnist-image-classification][]: pipeline for classific Mnist image classification problem.
- [pipeline-databinding-image-classification][]: pipeline example to train the iamge classification task which is to classifify [imgcook](https://www.imgcook.com/) databinding pictures.
- [pipeline-object-detection][]: pipeline example to train object detection task which is for component recognition used by imgcook.
- [python-keras][]: example to use Python Keras library to train deep leraning network in js syntax and runtime.

> For complete examples, see [here](./example).

And it is easy and quick to run these examples. For example, to do a minst image classification, just run the following to start the pipeline:

```
node examples/pipcook-app-example/pipcook-imageclass-app-test.js
```

[pipeline-mnist-image-classification]: example/pipeline-example/pipeline-mnist-image-classification.js
[pipeline-databinding-image-classification]: example/pipeline-example/pipeline-databinding-image-classification.js
[pipeline-object-detection]: example/pipeline-example/pipeline-object-detection.js
[python-keras]: example/python-nodejs-example/python-keras.js

## How to contribute

For detailed information about how to contribute to our project, Please check here [中文](https://alibaba.github.io/pipcook/doc/%E5%BC%80%E5%8F%91%E8%80%85%E6%89%8B%E5%86%8C-zh)｜ [english](https://alibaba.github.io/pipcook/doc/developer%20guide-en)

Please make sure you have installed Typescript and Lerna. To check, run the following commands:
```
lerna -v
tsc -v
```

First, clone the repository. Then, to bootstrap the lerna project (install all dependencies for npm packages), run:
```
lerna bootstrap
```
Please focus on the codes in `src` directory. Each time after you change something, run below command to compile codes:
```
lerna run compile
```

## RoadMap
 <img  src="https://img.alicdn.com/tfs/TB1qsKJtkT2gK0jSZFkXXcIQFXa-824-1178.jpg"  width="400"  height="580">
