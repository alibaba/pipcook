# Plugin Specification

Pipcook uses plugins to implement tasks in a specific machine learning cycle, which ensures that our core is simple, stable, and efficient enough. At the same time, through a set of plug-n specifications defined by pipcook, we can also allow third parties to develop plugins, which ensures the scalability of pipcook. Theoretically, through plugins, we can implement any machine learning task.

## Plugin type

We have defined seven types of machine learning lifecycle plugins:

| plugin name | description |
|-------------|-------------|
| [Data Collect](./plugin/0-data-collect.md) | data from different sources can be collected and stored in a unified dataset format, for more information about the dataset standards required by pipcook, see here. |
| [Data Access](./plugin/1-data-access.md) | this plugin access data to pipcook in the expected dataset format. It also describes and verifies samples to ensure that a high-quality dataset is used. |
| [Data Process](./plugin/2-data-process.md) | processing data |
| [Model Load](./plugin/3-model-load.md) | this plugin loads the model into the pipeline and eliminates the differences between models such as `keras` and `tensorflow`. |
| [Model Train](./plugin/4-model-train.md) | train models |
| [Model Evaluate](./plugin/5-model-evaluate.md) | evaluate a given model |
| [Model Deploy](./plugin/6-model-deploy.md) | deploy a given model |

## Plugin features

- Scalability: pipcook's capabilities are constantly extended through new plugins.
- Plugin pluggability: the input and output of each type of plugin must comply with our prototype specifications, and all plugins must inherit the prototypes of each type, this ensures that each one is pluggable and replaceable, and developers can develop third-party plug-ins to insert according to the specifications.
- Combination of plugins: not every life cycle in the pipeline is required, as long as the plugins with input and output can be combined together. This provides maximum flexibility in configuration and combination. For example, if you do not want to train a model but just want to evaluate another person's model with your own data, you can pull out the Model Train so that the Model Load can be directly linked to the Model Evaluate.

## Specification

We have defined interfaces and specifications for each type of plugins. Developers need to implement our interfaces and develop plug-ins according to the corresponding specifications, this ensures that any plugin can be seamlessly embedded into our pipeline.

### Plugin Parsing Component

For each plugin, we need to pass it into the corresponding type of parsers for parsing. For the above plugins, there are 7 types of parsers:

```ts
function DataCollect(plugin: PipcookPlugin, params: object);
function DataAccess(plugin: PipcookPlugin, params: object);
function DataProcess(plugin: PipcookPlugin, params: object);
function ModelLoad(plugin: PipcookPlugin, params: object);
function ModelTrain(plugin: PipcookPlugin, params: object);
function ModelEvaluate(plugin: PipcookPlugin, params: object);
function ModelDeploy(plugin: PipcookPlugin, params: object);
```

### Using Plugin

Pipcook plugins are divided into built-in, community and private. Each one is an independent npm package, and the required plugins need to be installed independently. For example, we need a model plugin loaded with `MobileNet`, we can use the following command in the project directory to install, **We will integrate the builtin plugins directly into a pipcook scaffold project. You do not need to install these builtin plugins separately.**

```sh
$ npm install mobileNetModelLoad --save
```

## Awesome Plugins

The following is a list of plugins in different types:

#### Data Collect

| Name | Description |
| --- | --- |
| [@pipcook/pipcook-plugins-image-class-data-collect](../plugins/%40pipcook-pipcook-plugins-image-class-data-collect.md) | Collect local or remote images and store them in pascol voc dataset format |
| [@pipcook/pipcook-plugins-image-mnist-data-collect](../plugins/%40pipcook-pipcook-plugins-image-mnist-data-collect.md) | Mnist handwritten dataset collection, stored in pascol voc dataset format |
| [@pipcook/pipcook-plugins-image-detection-data-collect](../plugins/%40pipcook-pipcook-plugins-image-detection-data-collect.md) | Collect local or remote target detection data and store them in pascol voc dataset format |
| [@pipcook/pipcook-plugins-text-class-data-collect](../plugins/%40pipcook-pipcook-plugins-text-class-data-collect.md) | Collect local or remote data of this classification and store it in csv data format |
| [@pipcook/pipcook-plugins-image-coco-data-collect](../plugins/%40pipcook-pipcook-plugins-image-coco-data-collect.md) | Collect local or remote object detection data in coco format and store it in pascol voc data format |


#### Data Access

| Name | Description |
| --- | --- |
| [@pipcook/pipcook-plugins-image-class-data-access](../plugins/%40pipcook-pipcook-plugins-image-class-data-access.md) | Image classification data access |
| [@pipcook/pipcook-plugins-text-csv-data-access](../plugins/%40pipcook-pipcook-plugins-text-csv-data-access.md) | Text classification data access |
| [@pipcook/pipcook-plugins-image-detection-data-access](../plugins/%40pipcook-pipcook-plugins-image-detection-data-access.md) | Simple target detection data access based on tfjs |
| [@pipcook/pipcook-plugins-detection-detectron-data-access](../plugins/%40pipcook-pipcook-plugins-detection-detectron-data-access.md) | Object detection model access based on detectron2 |

#### Data Process

| Name | Description |
| --- | --- |
| [@pipcook/pipcook-plugins-image-class-data-process](../plugins/%40pipcook-pipcook-plugins-image-class-data-process.md) | Image classification data preprocessing |
| [@pipcook/pipcook-plugins-text-class-data-process](../plugins/%40pipcook-pipcook-plugins-text-class-data-process.md) | Text Classification Data Word Segmentation preprocessing |

#### Model Load

| Name | Description |
| --- | --- |
| [@pipcook/pipcook-plugins-local-mobilenet-model-load](../plugins/%40pipcook-pipcook-plugins-local-mobilenet-model-load.md) | MobileNet model loading |
| [@pipcook/pipcook-plugins-bayesian-classifier-model-load](../plugins/%40pipcook-pipcook-plugins-bayesian-classifier-model-load.md) | Loading of Bayes classifier |
| [@pipcook/pipcook-plugins-simple-cnn-model-load](../plugins/%40pipcook-pipcook-plugins-simple-cnn-model-load.md) | Simple CNN model loading |
| [@pipcook/pipcook-plugins-detection-detectron-model-load](../plugins/%40pipcook-pipcook-plugins-detection-detectron-model-load.md) | Loading of object detection model based on detectron2 |

#### Model Train

| Name | Description |
| --- | --- |
| [@pipcook/pipcook-plugins-model-train](../plugins/%40pipcook-pipcook-plugins-model-train.md) | General tfjs model training |
| [@pipcook/pipcook-plugins-bayesian-classifier-model-train](../plugins/%40pipcook-pipcook-plugins-bayesian-classifier-model-train.md) | Bayes model training |
| [@pipcook/pipcook-plugins-detection-detectron-model-train](../plugins/%40pipcook-pipcook-plugins-detection-detectron-model-train.md) | Target detection model training based on detectron2 |

#### Model Evaluate

| Name | Description |
| --- | --- |
| [@pipcook/pipcook-plugins-class-model-evaluate](../plugins/%40pipcook-pipcook-plugins-class-model-evaluate.md) | Classification Model Evaluation |
| [@pipcook/pipcook-plugins-detection-detectron-model-evaluate](../plugins/%40pipcook-pipcook-plugins-detection-detectron-model-evaluate.md) | Evaluation of target detection model based on detectron2 |

#### Model Deploy

| Name | Description |
| --- | --- |
| [@pipcook/pipcook-plugins-text-class-local-model-deploy](../plugins/%40pipcook-pipcook-plugins-text-class-local-model-deploy.md) | Text Classification local deployment |
| [@pipcook/pipcook-plugins-image-class-local-model-deploy](../plugins/%40pipcook-pipcook-plugins-image-class-local-model-deploy.md) | Image classification local deployment |
| [@pipcook/pipcook-plugins-detection-detectron-model-deploy](../plugins/%40pipcook-pipcook-plugins-detection-detectron-model-deploy.md) | Target Detection local deployment |
