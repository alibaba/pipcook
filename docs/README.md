# Pipcook

The Pipcook Project is an open-source toolkit to enable and accelerate intelligentization of front-end engineering for Web developers.

## Why Pipcook

With the mission of enabling Web engineers to utilize the power of machine learning without any prerequisites and the vision to lead front-end technical field to the intelligence. [Pipcook][] is to become the toolkit for the cross-cutting area of machine learning and front-end interaction.

We are truly to design Pipcook's machine learning APIs for front-end applications, and focusing on the front-end area and developed from the Web engineers' view. With the principle of being friendly to Web, we will push the whole area forward with the machine learning engineering.

## What's Pipcook

The project provides toolkit components include machine learning pipeline framework, management tools, a JavaScript runtime for machine learning and more, and these can be also used as building blocks in conjunction with other projects.

### Principles

[Pipcook][] is an open source project guided by strong principles, aiming to be modular and flexible on user experience. It is open to the community to help set its direction.

- **Modular** the project includes lots of components that have well-defined functions and APIs that work together.
- **Swappable** the project includes enough components to build what Pipcook has done, but its modular architecture ensures that most of the components can be swapped by different implementations.
- **Developer Focused** The APIs are intended to be functional and useful to build powerful tools. They are not necessarily intended as end user tools but as components aimed at developers.

### Audience

[Pipcook][] is intended for Web engineers looking to:

- learn what's machine learning.
- train own models and serve them.
- optimize own models for better model evaluation results, like higher accracy for an image classification.

> If you are in the above conditions, just try it via [installation guide](INSTALL.md).

### Components

__Pipcook Pipeline__

It's used to represent ML pipelines consisting of Pipcook plugins. This layer ensures the stability and scalability of the whole system, and uses a plug-in mechanism to support rich functions including: dataset, training, validations and deployment.

A Pipcook Pipeline is generally composed of lots of plugins. Through different plugins and configurations, the final output to us is an NPM package, which contains the trained model and JavaScript functions that can be used directly.

> Note: In Pipcook, each pipeline has only one role, which is to output the above trained model you need. That is to say, the last stage of each pipeline must be the output of the trained model, otherwise this Pipeline is invalid.

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
