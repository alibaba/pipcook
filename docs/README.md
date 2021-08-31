# Pipcook

The Pipcook Project is an open-source toolkit to enable and accelerate the intelligentization of front-end engineering for Web developers.

# Usage
Using Pipcook for machine learning development is very simple. It only takes four steps: install, train, test, and deploy.

Install the [Pipcook][] command-line tool:

```shell
$ npm install -g @pipcook/cli
```

Then train from anyone of those [pipelines](./example/pipelines/), we take image classification as an example:

```shell
$ pipcook train https://cdn.jsdelivr.net/gh/alibaba/pipcook@main/example/pipelines/image-classification-mobilenet.json -o ./output
```
This dataset specfied by the pipeline includes 2 categories image: `avatar` and `blurBackground`.
After training, we can predict the category of a image:

```shell
$ pipcook predict ./output/image-classification-mobilenet.json -s ./output/data/validation/blurBackground/71197_223__30.7_36.jpg
✔ Origin result:[{"id":1,"category":"blurBackground","score":0.9998120665550232}]
```

The input is a `blurBackground` image from the validation dataset. And the model determines that its category is `blurBackground`.

Want to deploy it?
```shell
$ pipcook serve ./output
ℹ preparing framework
ℹ preparing scripts
ℹ preparing artifact plugins
ℹ initializing framework packages
Pipcook has served at: http://localhost:9091
```

Then you can open the browser and try your image classification server.

## Why Pipcook

With the mission of enabling Web engineers to utilize the power of machine learning without any prerequisites and the vision to lead front-end technical field to the intelligence. [Pipcook][] is to become the toolkit for the cross-cutting area of machine learning and front-end interaction.

We are truly to design Pipcook's machine learning APIs for front-end applications, and focusing on the front-end area and developed from the Web engineers' view. With the principle of being friendly to the Web, we will push the whole area forward with the machine learning engineering.

## What's Pipcook

The project provides subprojects include machine learning pipeline framework, management tools, a JavaScript runtime for machine learning, and these can be also used as building blocks in conjunction with other projects.

### Principles

[Pipcook][] is an open-source project guided by strong principles, aiming to be modular and flexible on user experience. It is open to the community to help set its direction.

- **Modular** the project includes some of projects that have well-defined functions and APIs that work together.
- **Swappable** the project includes enough modules to build what Pipcook has done, but its modular architecture ensures that most of the modules can be swapped by different implementations.

### Audience

[Pipcook][] is intended for Web engineers looking to:

- learn what's machine learning.
- train their models and serve them.
- optimize own models for better model evaluation results, like higher accuracy for image classification.

> If you are in the above conditions, just try it via [installation guide](INSTALL.md).

### Subprojects

__Pipcook Pipeline__

It's used to represent ML pipelines consisting of Pipcook scripts. This layer ensures the stability and scalability of the whole system and uses a [Script](manual/intro-to-script.md) mechanism to support rich functions including datasource, dataflow, training, validations.

A Pipcook Pipeline is generally composed of lots of scripts. Through different scripts and configurations, the final output to us is a directory, which contains the trained model.

__Pipcook Bridge to Python__

For JavaScript engineers, the most difficult part is the lack of a mature machine learning toolset in the ecosystem. In Pipcook, a module called **Boa**, which provides access to Python packages by bridging the interface of [CPython][] using N-API.

With it, developers can use packages such as `numpy`, `scikit-learn`, `jieba`, `tensorflow`, or any other Python ecology in the Node.js runtime through JavaScript.

## The Next

Can't wait to start a [Pipcook][] project? You can follow the guidance below to proceed to the next step:

- [Learn how to install Pipcook?](INSTALL.md)
- [Learn machine learning](tutorials/machine-learning-overview.md)
- [Learn Pipcook from Pipeline](manual/intro-to-pipeline.md)
- [Learn Pipcook from Boa](manual/intro-to-boa.md)
- [Learn Pipcook Tools](manual/pipcook-tools.md)

[Pipcook]: https://github.com/alibaba/pipcook
[CPython]: https://github.com/python/cpython
