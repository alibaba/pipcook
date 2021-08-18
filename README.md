<p align="center">
  <a href="https://alibaba.github.io/pipcook/">
    <img alt="pipcook" src="./docs/images/logo.png" width="160">
  </a>
</p>

<p align="center">
  A JavaScript application framework for machine learning and its engineering.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@pipcook/core">
    <img alt="npm" src="https://img.shields.io/npm/v/@pipcook/core"></a>
  <a href="https://www.npmjs.com/package/@pipcook/core">
    <img alt="npm" src="https://img.shields.io/npm/dm/@pipcook/core"></a>
  <a href="https://github.com/alibaba/pipcook">
    <img alt="GitHub repo size" src="https://img.shields.io/github/repo-size/alibaba/pipcook"></a>
  <a href="https://opensource.org/licenses/Apache-2.0">
    <img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg"></a>
</p>

<p align="center">
  Read this in other languages: English | <a href="docs/zh-ch/README.md">简体中文</a>
</p>

## Builds

| Build Types | Status |
|---------------|--------|
| tests         | <a href="https://github.com/alibaba/pipcook/actions?query=workflow%3Abuild"><img src="https://github.com/alibaba/pipcook/workflows/build/badge.svg?branch=main&event=push"></a> |
| pipeline      | <a href="https://github.com/alibaba/pipcook/actions?query=workflow%3Apipeline"><img src="https://github.com/alibaba/pipcook/workflows/pipeline/badge.svg?branch=main"></a> |
| release       | <a href="https://github.com/alibaba/pipcook/actions?query=workflow%3A%22Publish+Packages%22"><img src="https://github.com/alibaba/pipcook/workflows/Publish%20Packages/badge.svg"></a> |
| documentation | <a href="https://github.com/alibaba/pipcook/actions?query=workflow%3Agh-pages"><img src="https://github.com/alibaba/pipcook/workflows/gh-pages/badge.svg"></a> |
| docker        | <a href="https://hub.docker.com/r/pipcook/pipcook"><img src="https://img.shields.io/docker/cloud/build/pipcook/pipcook"></a> |

## Why Pipcook

With the mission of enabling JavaScript engineers to utilize the power of machine learning without any
prerequisites and the vision to lead front-end technical field to the intelligention. [Pipcook][] is to become
the JavaScript application framework for the cross-cutting area of machine learning and front-end interaction.

We are truly to design Pipcook's API for front-end and machine learning applications, and focusing on the front-end
area and developed from the JavaScript engineers' view. With the principle of being friendly to JavaScript, we will 
push the whole area forward with the machine learning engineering. For this reason we opened an issue about 
[machine-learning application APIs][], and look forward to you get involved.

## What's Pipcook

The project provides subprojects including machine learning pipeline framework, management tools, a JavaScript runtime for machine learning, and these can be also used as building blocks in conjunction with other projects.

### Principles

[Pipcook][] is an open-source project guided by strong principles, aiming to be modular and flexible on user experience. It is open to the community to help set its direction.

- **Modular** the project includes some of projects that have well-defined functions and APIs that work together.
- **Swappable** the project includes enough modules to build what Pipcook has done, but its modular architecture ensures that most of the modules can be swapped by different implementations.

### Audience

[Pipcook][] is intended for Web engineers looking to:

- learn what's machine learning.
- train their models and serve them.
- optimize own models for better model evaluation results, like higher accuracy for image classification.

> If you are in the above conditions, just try it via [installation guide](docs/INSTALL.md).

### Subprojects

__Pipcook Pipeline__

It's used to represent ML pipelines consisting of Pipcook scripts. This layer ensures the stability and scalability of the whole system and uses a plug-in mechanism to support rich functions including dataset, training, validations, and deployment.

A Pipcook Pipeline is generally composed of lots of scripts. Through different scripts and configurations, the final output to us is an NPM package, which contains the trained model and JavaScript functions that can be used directly.

> Note: In Pipcook, each pipeline has only one role, which is to output the above-trained model you need. That is to say, the last stage of each pipeline must be the output of the trained model, otherwise, this Pipeline is invalid.

__Pipcook Bridge to Python__

For JavaScript engineers, the most difficult part is the lack of a mature machine learning toolset in the ecosystem. In Pipcook, a module called [Boa][https://github.com/imgcook/boa], which provides access to Python packages by bridging the interface of [CPython][] using N-API.

With it, developers can use packages such as `numpy`, `scikit-learn`, `jieba`, `tensorflow`, or any other Python ecology in the Node.js runtime through JavaScript.

## Quick start

### Setup

Prepare the following on your machine:

| Installer   | Version Range |
|-------------|---------------|
| [Node.js][] | >= 12.17 or >= 14.0.0 |
| [npm][]    | >= 6.14.4       |

Install the command-line tool for managing [Pipcook][] projects:

```shell
$ npm install -g @pipcook/cli
```

Then train from a [pipeline](./example/pipelines/):

```shell
$ pipcook train https://cdn.jsdelivr.net/gh/alibaba/pipcook@main/example/pipelines/image-classification-mobilenet.json -o ./output
```
Predict the category of a image:

```shell
$ pipcook predict ./output/image-classification-mobilenet.json -s ./output/data/validation/blurBackground/71197_223__30.7_36.jpg
✔ Origin result:[{"id":1,"category":"blurBackground","score":0.9998120665550232}]
```
The category is `blurBackground`.

### Playground

If you are wondering what you can do in [Pipcook][] and where you can check your training logs and models, you could start from [Pipboard](https://alibaba.github.io/pipcook/#/GLOSSORY?id=pipboard):

```sh
open https://pipboard.imgcook.com
```

You will see a web page prompt in your browser, and there is a MNIST showcase on the home page and play around there. 

### Pipelines

If you want to train a model to recognize MNIST handwritten digits by yourself, you could try the examples below.

| Name | Description | Open in Colab |
| ---- | ----------- | ----- |
| mnist-image-classification | pipeline for classific MNIST image classification problem. | N/A |
| databinding-image-classification | pipeline example to train the image classification task which is <br/>to classify [imgcook](https://www.imgcook.com/) databinding pictures. | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/alibaba/pipcook/blob/main/notebooks/pipcook_image_classification.ipynb) |
| object-detection | pipeline example to train object detection task which is for component recognition <br/>used by imgcook. | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/alibaba/pipcook/blob/main/notebooks/pipcook_object_detection.ipynb) |
| text-bayes-classification | pipeline example to train text classification task with bayes | N/A |

See [here](./example/pipelines) for complete list, and it's easy and quick to run these examples. For example, to do a MNIST 
image classification, just run the following to start the pipeline:

```sh
$ pipcook run https://cdn.jsdelivr.net/gh/alibaba/pipcook@main/example/pipelines/image-classification-mobilenet.json -o output
```

After the above pipeline is completed, you have already trained a model at the current `output/model` directory, it's a tensorflow.js model.

## Documentation

Please refer to [English](https://alibaba.github.io/pipcook/#/) | [中文](https://alibaba.github.io/pipcook/#/zh-cn/)

## Developers

Clone this repository:

```sh
$ git clone git@github.com:alibaba/pipcook.git
```

Install dependencies, e.g. via [npm][]:

```sh
$ npm install
```

After the above, now build the project:

```sh
$ npm run build
```

- Developer Documentation [English](./docs/contributing/guide-to-contributor.md) | [中文](./docs/zh-cn/contributing/guide-to-contributor.md)
- [Project Guide](./docs/meta/PROJECT_GUIDE.md)

## Community

#### DingTalk

<img width="200" src="./docs/images/community_qrcode.jpg">

Or searched via the group number: 30624012.

> Download DingTalk (an all-in-one free communication and collaboration platform) here: [English](https://www.dingtalk.com/static/en/download) | [中文](https://page.dingtalk.com/wow/dingtalk/act/download)

#### Gitter Room

<a href="https://gitter.im/alibaba/pipcook">
  <img src="https://img.shields.io/gitter/room/alibaba/pipcook?logo=pipcook&style=flat-square" />
</a>

#### Who's using it

<a href="https://www.imgcook.com"><img height="40" src="https://img.alicdn.com/tfs/TB1lle4yQzoK1RjSZFlXXai4VXa-200-64.png"></a>

## License

[Apache 2.0](./LICENSE)

[Pipcook]: https://github.com/alibaba/pipcook
[lerna]: https://github.com/lerna/lerna
[TypeScript]: https://github.com/microsoft/TypeScript
[Node.js]: https://nodejs.org/
[npm]: https://npmjs.com/
[Python]: https://www.python.org/
[CPython]: https://github.com/python/cpython
[machine-learning application APIs]: https://github.com/alibaba/pipcook/issues/33
[pipeline-mnist-image-classification]: example/pipelines/mnist-image-classification.json
[pipeline-databinding-image-classification]: example/pipelines/databinding-image-classification-mobilenet.json
[pipeline-object-detection]: example/pipelines/object-detection-yolo.json
[pipeline-text-bayes-classification]: example/pipelines/text-classification-bayes.json
[detectron2 installation reference]: https://github.com/facebookresearch/detectron2/blob/master/INSTALL.md
