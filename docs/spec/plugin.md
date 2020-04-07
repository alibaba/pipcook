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
$ npm install @pipcook/plugins-tfjs-mobilenet-model-load --save
```

## Awesome Plugins

The following is a list of plugins in different types:

### DataCollect

@pipcook/plugins-csv-data-collect
@pipcook/plugins-image-classification-data-collect
@pipcook/plugins-mnist-data-collect
@pipcook/plugins-object-detection-coco-data-collect
@pipcook/plugins-object-detection-pascolvoc-data-collect


### DataAccess

@pipcook/plugins-coco-data-access
@pipcook/plugins-csv-data-access
@pipcook/plugins-pascolvoc-data-access

### DataProcess

@pipcook/plugins-image-data-process

### ModelLoad

@pipcook/plugins-bayesian-model-load
@pipcook/plugins-detectron-fasterrcnn-model-load
@pipcook/plugins-pytorch-simplecnn-model-load
@pipcook/plugins-tfjs-mobilenet-model-load
@pipcook/plugins-tfjs-simplecnn-model-load

### ModelTrain

@pipcook/plugins-bayesian-model-train
@pipcook/plugins-image-classification-pytorch-model-train
@pipcook/plugins-image-classification-tfjs-model-train
@pipcook/plugins-object-detection-detectron-model-train

### ModelEvaluate

@pipcook/plugins-image-data-process
@pipcook/plugins-bayesian-model-evaluate
@pipcook/plugins-image-classification-pytorch-model-evaluate
@pipcook/plugins-image-classification-tfjs-model-evaluate
@pipcook/plugins-object-detection-detectron-model-evaluate