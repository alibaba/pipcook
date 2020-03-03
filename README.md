# Pipcook

A JavaScript application framework for machine learning and its engineering.

<a href="https://www.npmjs.com/package/@pipcook/pipcook-core">
  <img alt="npm" src="https://img.shields.io/npm/dm/@pipcook/pipcook-core"></a>
<a href="https://www.npmjs.com/package/@pipcook/pipcook-core">
  <img alt="npm" src="https://img.shields.io/npm/v/@pipcook/pipcook-core"></a>
<a href="https://github.com/alibaba/pipcook/actions">
  <img alt="Github Action Build" src="https://github.com/alibaba/pipcook/workflows/build/badge.svg?branch=master&event=push"></a>
<a href="https://hub.docker.com/r/pipcook/pipcook">
  <img alt="Docker Cloud Build Status" src="https://img.shields.io/docker/cloud/build/pipcook/pipcook"></a>
<a href="https://github.com/alibaba/pipcook">
  <img alt="GitHub repo size" src="https://img.shields.io/github/repo-size/alibaba/pipcook"></a>
<a href="https://opensource.org/licenses/Apache-2.0">
  <img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg"></a>

## Why Pipcook

With the mission of enabling JavaScript engineers to utilize the power of machine learning without any
prerequisites and the vision to lead front-end technical field to the intelligention. [Pipcook][] is to become
the JavaScript application framework for the cross-cutting area of machine learning and front-end interaction.

We are truly to design Pipcook's API for front-end and machine learning applications, and focusing on the front-end
area and developed from the JavaScript engineers' view. With the principle of being friendly to JavaScript, we will 
push the whole area forward with the machine learning engineering. For this reason we opened an issue about 
[machine-learning application APIs][], and look forward to you get involved.

## What's Pipcook

Pipcook can be divided into the following 3 layers from top to bottom.

__Pipcook Application__

It defines flexible and intuitive APIs to build machine-learning application, even though you don't know the details 
of algorithm.

__Pipcook Core__

It's used to represent ML pipelines consisting of Pipcook plugins. This layer ensures the stability and scalability 
of the whole system, and uses a plug-in mechanism to support rich functions including: dataset, training, validations
and deployment.

__Pipcook Bridge to Python__

For JavaScript engineers, the most difficult part is the lack of a mature machine learning toolset in the ecosystem.
To this end, we have opened up the interaction between Python and Node.js at the bottom and can easily call some 
missing APIs.

## Quick start

### Setup

Prepare the following on your machine:

| Installer   | Version range |
|-------------|---------------|
| [Node.js][] | >= 10.16      |
| [Python][]  | >= 3.6        |
| [npm][]     | >= 6.1        |

Install the command-line tool for managing [Pipcook][] projects:

```shell
$ npm install -g @pipcook/pipcook-cli
```

Initialize a project:

```shell
$ mkdir pipcook-example && cd pipcook-example
$ pipcook init
$ cd pipcook-project
```

### Examples

In this reposiory, We have prepared several examples, some of they are:

- [pipeline-mnist-image-classification][]: pipeline for classific Mnist image classification problem.
- [pipeline-databinding-image-classification][]: pipeline example to train the iamge classification task which is 
  to classifify [imgcook](https://www.imgcook.com/) databinding pictures.
- [pipeline-object-detection][]: pipeline example to train object detection task which is for component recognition 
  used by imgcook.
- [python-keras][]: example to use Python Keras library to train deep leraning network in js syntax and runtime.

See [here](./example) for complete list, and it's easy and quick to run these examples. For example, to do a minst 
image classification, just run the following to start the pipeline:

```shell
$ node examples/pipcook-app-example/pipcook-imageclass-app-test.js
```

## Documentation

Please refer to [中文](https://alibaba.github.io/pipcook/doc/pipcook%20%E6%98%AF%E4%BB%80%E4%B9%88-zh)｜ [english](https://alibaba.github.io/pipcook/doc/What%20is%20Pipcook%3F-en)

## Developers

Clone this repository:

```shell
$ git clone git@github.com:alibaba/pipcook.git
```

Install [lerna][] and [TypeScript][], and check:

```shell
$ lerna -v
$ tsc -v
```

or install via [npm][]:

```shell
$ npm install
```

After the above, now build the project:

```shell
$ npm run build
```

- Developer Documentation [中文](https://alibaba.github.io/pipcook/doc/%E5%BC%80%E5%8F%91%E8%80%85%E6%89%8B%E5%86%8C-zh) ｜ [english](https://alibaba.github.io/pipcook/doc/developer%20guide-en)
- [Project Guide](./docs/meta/PROJECT_GUIDE.md)
- [Roadmap, 2020](https://github.com/alibaba/pipcook/issues/30)

## License

[Apache 2.0](./LICENSE)

[Pipcook]: https://github.com/alibaba/pipcook
[lerna]: https://github.com/lerna/lerna
[TypeScript]: https://github.com/microsoft/TypeScript
[Node.js]: https://nodejs.org/
[npm]: https://npmjs.com/
[Python]: https://www.python.org/
[machine-learning application APIs]: https://github.com/alibaba/pipcook/issues/33
[pipeline-mnist-image-classification]: example/pipeline-example/pipeline-mnist-image-classification.js
[pipeline-databinding-image-classification]: example/pipeline-example/pipeline-databinding-image-classification.js
[pipeline-object-detection]: example/pipeline-example/pipeline-object-detection.js
[python-keras]: example/python-nodejs-example/python-keras.js
