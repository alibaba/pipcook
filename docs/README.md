# Pipcook

A JavaScript application framework for machine learning and its engineering.

<a href="https://github.com/alibaba/pipcook/actions">
  <img alt="Github Action Build" src="https://github.com/alibaba/pipcook/workflows/build/badge.svg?branch=master&event=push"></a>
<a href="https://hub.docker.com/r/pipcook/pipcook">
  <img alt="Docker Cloud Build Status" src="https://img.shields.io/docker/cloud/build/pipcook/pipcook"></a>

## Why Pipcook

With the mission of enabling JavaScript engineers to utilize the power of machine learning without any prerequisites and the vision to lead front-end technical field to the intelligence. [Pipcook][] is to become the JavaScript application framework for the cross-cutting area of machine learning and front-end interaction.

We are truly to design Pipcook's API for front-end and machine learning applications, and focusing on the front-end area and developed from the JavaScript engineers' view. With the principle of being friendly to JavaScript, we will push the whole area forward with the machine learning engineering.

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

## How does it work

The core of Pipcook is a pipeline in which a series of plugins will be embedded. Each plugin is responsible for specific steps in the machine learning lifecycle. The input and output data of each plugin will be circulated in this pipeline. Pipcook is based on the Rxjs responsive framework and is responsible for responding, scheduling, and managing the data in the pipeline. The pipeline of Pipcook is shown in the following:

![](https://img.alicdn.com/tfs/TB1eZrDtkT2gK0jSZFkXXcIQFXa-2323-969.png)

Our plugin mechanism is highly scalable and following the principle that one plugin only does one thing. pipcook connects these plugins to implement a machine learning engineering pipeline. At the same time, users only need to call some simple APIs to specify the required plugins and build a project.

### Concept

- **Runner** is the components scheduler in Pipcook. Components to start must be pass to an instance of `Runner`.
- **Pipeline**, the plugin is embeded into a pipeline. Data and models are circulated in the pipeline. Each plugin blocks the data for processing and then pipes to next.
- **Plugin**, Pipcook owns built-in plugins, community and private plugins. Each plugin is responsible for one thing(function), a specific task in the machine learning lifecycle.
- **Component** is provided by Pipcook and is responsible for parsing the plugin. When using the plugin, you need to pass the plugin to the component for parsing.

## Get started

Can't wait to start a [Pipcook][] project? Please see [get started](tutorials/get-started.md).

## Advanced

After building a machine learning application, if you want to learn more about Pipcook, see the followings:

- Tutorial
  - [Get started with command-line tools](./tutorials/get-started-with-cli.md)
  - [Developer Guide](./devel/developer-guide.md)
  - [How to develop a plugin](./tutorials/how-to-develop-a-plugin.md)
  - [Boa specification (want to use Python in Node.js?)](./tutorials/want-to-use-python.md)

- Specification
  - [Plugin Specification](./spec/plugin.md)
  - [Dataset Specification](./spec/dataset.md)

- [API Reference](/typedoc) (only available on website)

[Pipcook]: https://github.com/alibaba/pipcook
