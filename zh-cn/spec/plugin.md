# 插件规范

Pipcook 使用插件的形式来实现具体机器学习周期中的任务，这可以保证我们的核心足够精简，稳定和高效。同时，通过 Pipcook 定义的一套对于每个环节的插件规范，我们还可以允许第三方开发插件，这样就保证了 Pipcook 的可扩展性，理论上通过插件，我们可以实现任意一个机器学习的任务。

## 插件类型

我们一共定义了七个类型机器学习生命周期的插件，他们分别是：

- DataCollect: 数据收集插件： 往往数据集是不一致的，分散的，通过此插件可以将不同来源的数据收集过来，并以统一的数据集格式存储, 有关 pipcook 要求的数据集标准，请参考这里
- DataAccess: 数据接入插件： 此插件以期待的数据集格式将数据接入pipcook，同时，还会进行对样本的描述和验证，以确保我们运用了一个高质量的数据集
- DataProcess: 数据处理插件：对数据进行处理工作
- ModelDefine: 用于定义模型，此插件将模型加载到 pipeline 中，同时会抹平 keras，python tf 等模型的差异
- ModelTrain: 模型训练： 训练模型
- ModelEvaluate: 评估模型
- ModelDeploy: 部署模型

## 插件特点

- 可扩展性： Pipcook 的能力和所要解决的问题会不断的通过新的插件扩展
- 插件可插拔性：每个类型的插件的输入和输出需要符合我们的原型规范，所有的插件需要继承我们每个类别的原型，这样就保证了每个环节都是可插拔和可更换的，开发者可以按照规范开发第三方插件插入。
- 插件可组合性： pipeline中并不是每个环节都是必须的，只要是输入和输出相对应的插件就可以组合在一起。这样最大的提供了配置和组合的灵活性。例如：如果并不想训练模型而只是想拿自己的数据评估一下别人的模型，那么可以把 Model Train 拔出，这样 Model Load 直接和 Model Evaluate 也是可以链接的

## 插件规范

我们为每个类型的插件定义了接口和规范，开发者需要实现我们的接口并按照相应的规范进行开发插件，这样能保证任何插件可以无缝嵌入到我们的 pipeline 中，有关更多插件规范的信息，请移步[这里](../devel/developer-guide.md)。

### 插件解析组件 (Component)

对于每个插件，我们需要把它传入相应类型的解析器进行解析，对于上述7种类型的插件会有10种类型的解析器，他们分别是:

```ts
function DataCollect(plugin: EscherPlugin, params: object);
function DataAccess(plugin: EscherPlugin, params: object);
function DataProcess(plugin: EscherPlugin, params: object);
function ModelDefine(plugin: EscherPlugin, params: object);
function ModelTrain(plugin: EscherPlugin, params: object);
function ModelEvaluate(plugin: EscherPlugin, params: object);
function ModelDeploy(plugin: EscherPlugin, params: object);
```

### 使用插件

Pipcook 的插件分为内置插件和第三方插件，每个插件都是一个独立的 npm 包，对于所需的插件，需要独立安装，例如，我们需要一个载入 MobileNet 的模型插件，我们可以在工程目录中使用如下命令安装，**我们会将内置插件直接集成到一个 pipcook 脚手架工程里，您不需要单独安装这些内置插件**

```sh
$ npm install @pipcook/plugins-tfjs-mobilenet-model-define --save
```

## 插件列表

如下是目前 Pipcook 支持的插件列表：

### DataCollect

@pipcook/plugins-csv-data-collect
@pipcook/plugins-image-classification-data-collect
@pipcook/plugins-mnist-data-collect
@pipcook/plugins-object-detection-coco-data-collect
@pipcook/plugins-object-detection-pascalvoc-data-collect


### DataAccess

@pipcook/plugins-coco-data-access
@pipcook/plugins-csv-data-access
@pipcook/plugins-pascalvoc-data-access

### DataProcess

@pipcook/plugins-image-data-process

### ModelDefine

@pipcook/plugins-bayesian-model-define
@pipcook/plugins-detectron-fasterrcnn-model-define
@pipcook/plugins-tfjs-mobilenet-model-define
@pipcook/plugins-tfjs-simplecnn-model-define

### ModelTrain

@pipcook/plugins-bayesian-model-train
@pipcook/plugins-image-classification-tfjs-model-train
@pipcook/plugins-object-detection-detectron-model-train

### ModelEvaluate

@pipcook/plugins-image-data-process
@pipcook/plugins-bayesian-model-evaluate
@pipcook/plugins-image-classification-tfjs-model-evaluate
@pipcook/plugins-object-detection-detectron-model-evaluate
