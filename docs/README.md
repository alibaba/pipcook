# What is Pipcook?

With the mission of enabaling front-end developers to use machine learning with no prerequisites and the vision of leading the front-end technology field to intelligentization, pipcook has became a one-stage front-end algorithm engineering platform that process data, train models, and deploy models. Pipcook will focus on the front-end field,  adhere to the principle  being friendly to front-end engineers, and finally promote the development of the front-end industry with machine learning.

### How does it work

The core of Pipcook is a pipeline in which a series of plugins will be embedded. Each plugin is responsible for specific steps in the machine learning lifecycle. The input and output data of each plugin will be circulated in this pipeline. Pipcook is based on the Rxjs responsive framework and is responsible for responding, scheduling, and managing the data in the pipeline. The pipeline of Pipcook is shown in the following:

![](https://img.alicdn.com/tfs/TB1eZrDtkT2gK0jSZFkXXcIQFXa-2323-969.png)

Our plugin mechanism is highly scalable and following the principle that one plugin only does one thing. pipcook connects these plugins to implement a machine learning engineering pipeline. At the same time, users only need to call some simple APIs to specify the required plugins and build a project.

### Quick start

Can't wait to start a Pipcook project? Please [check here to quickly start a project](tutorials/get-started.md).

### Concept

- **Runner** is the components scheduler in Pipcook. Components to start must be pass to an instance of `Runner`.
- **Pipeline**, the plugin is embeded into a pipeline. Data and models are circulated in the pipeline. Each plugin blocks the data for processing and then pipes to next.
- **Plugin**, Pipcook owns built-in plugins, community and private plugins. Each plugin is responsible for one thing(function), a specific task in the machine learning lifecycle.
- **Component** is provided by Pipcook and is responsible for parsing the plugin. When using the plugin, you need to pass the plugin to the component for parsing.

### Advanced

After building a machine learning application, if you want to learn more about Pipcook, see the followings:

- Tutorial
  - [Get started with Pipeline API](./tutorials/get-started-with-pipeline-api.md)
  - [Get started with command-line tools](./tutorials/get-started-with-cli.md)
  - [Developer Guide](./tutorials/developer-guide.md)
  - [How to develop a plugin](./tutorials/how-to-develop-a-plugin.md)
  - [Load a pre-trained model in Pipcook](./tutorials/load-a-pre-trained-model-in-pipcook.md)
  - [Want to use Python?](./tutorials/want-to-use-python.md)

- Specification
  - [Plugin Specification](./spec/plugin.md)
  - [Dataset Specification](./spec/dataset.md)
