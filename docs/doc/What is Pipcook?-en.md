# What is Pipcook?

With the mission of enabaling front-end developers to use machine learning with no prerequisites and the vision of leading the front-end technology field to intelligentization, pipcook has became a one-stage front-end algorithm engineering platform that process data, train models, and deploy models. Pipcook will focus on the front-end field,  adhere to the principle  being friendly to front-end engineers, and finally promote the development of the front-end industry with machine learning.

<a name="wB8yF"></a>
### How does it work

---


The core of Pipcook is a pipeline in which a series of plugins will be embedded. Each plugin is responsible for specific steps in the machine learning lifecycle. The input and output data of each plugin will be circulated in this pipeline. Pipcook is based on the Rxjs responsive framework and is responsible for responding, scheduling, and managing the data in the pipeline. The pipeline of Pipcook is shown in the following:

![](https://img.alicdn.com/tfs/TB1eZrDtkT2gK0jSZFkXXcIQFXa-2323-969.png)

Our plugin mechanism is highly scalable and following the principle that one plugin only does one thing. pipcook connects these plugins to implement a machine learning engineering pipeline. At the same time, users only need to call some simple APIs to specify the required plugins and build a project.

<a name="fUpgW"></a>
### Quick start

---

Can't wait to start a pipcook project ?, Please [check here to quickly start a project](https://alibaba.github.io/pipcook/doc/Quick%20Start-en).

<a name="uXh3I"></a>
### Concept

---

- Plugin: pipcook plugin. We will provide built-in plugins and support third-party plugins. Each plugin is responsible for one thing, a specific task in the machine learning lifecycle.
- Component: the component is provided by Pipcook and is responsible for parsing the plugin content. When using the plugin, you need to pass the plugin to the component for parsing.
- Pipeline: The pipcook plugin is embeded into the pipeline. Data and models are circulated in the pipeline. Each plugin blocks the data for processing and then releases the data.
- Runner: Pipcook core scheduling. We pass all components to runner to start the pipcook project.

<a name="3UYG8"></a>
### Advanced

---

After building a machine learning project, if you want to learn more about pipcook, see the following link for more information

- [Learn more about plugins](https://alibaba.github.io/pipcook/doc/Introduction%20of%20pipcook%20plugin-en)
- [Want to use python?](https://alibaba.github.io/pipcook/doc/Want%20to%20use%20python%3F-en)
- [Learn more about the built-in pipeline](https://alibaba.github.io/pipcook/doc/Built-in%20pipeline%20detail-en)
- [Learn more about the command line tool pipcook-cli](https://alibaba.github.io/pipcook/doc/pipcook-cli-en)
- [Load a pre-trained model in pipcook](https://alibaba.github.io/pipcook/doc/Load%20a%20pre-trained%20model%20in%20pipcook-en)

<a name="fi47u"></a>
### Want to Contribute?

---

Please refer to our [Developer Guide](https://alibaba.github.io/pipcook/doc/developer%20guide-en)
