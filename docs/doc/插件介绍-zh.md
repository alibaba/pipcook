# 插件介绍

pipcook 使用插件的形式来实现具体机器学习周期中的任务，这可以保证我们的核心足够精简，稳定和高效。同时，通过 pipcook 定义的一套对于每个环节的插件规范，我们还可以允许第三方开发插件，这样就保证了 pipcook 的可扩展性，理论上通过插件，我们可以实现任意一个机器学习的任务。


<a name="f64c5b65"></a>
### 插件类型

---

我们一共定义了七个类型机器学习生命周期的插件，他们分别是：

- Data Collect: 数据收集插件： 往往数据集是不一致的，分散的，通过此插件可以将不同来源的数据收集过来，并以统一的数据集格式存储, 有关 pipcook 要求的数据集标准，请参考这里
- Data Access: 数据接入插件： 此插件以期待的数据集格式将数据接入pipcook，同时，还会进行对样本的描述和验证，以确保我们运用了一个高质量的数据集
- Data Process: 数据处理插件：对数据进行处理工作
- Model Load: 加载模型，此插件将模型加载到 pipeline 中，同时会抹平 keras，python tf 等模型的差异
- Model Train: 模型训练： 训练模型
- Model Evaluate: 评估模型
- Model Deploy: 部署模型

<a name="7642472a"></a>
### 插件特点

---

- 可扩展性： pipcook 的能力和所要解决的问题会不断的通过新的插件扩展
- 插件可插拔性：每个类型的插件的输入和输出需要符合我们的原型规范，所有的插件需要继承我们每个类别的原型，这样就保证了每个环节都是可插拔和可更换的，开发者可以按照规范开发第三方插件插入。
- 插件可组合性： pipeline中并不是每个环节都是必须的，只要是输入和输出相对应的插件就可以组合在一起。这样最大的提供了配置和组合的灵活性。例如：如果并不想训练模型而只是想拿自己的数据评估一下别人的模型，那么可以把 Model Train 拔出，这样 Model Load 直接和 Model Evaluate 也是可以链接的

<a name="ff93a5f0"></a>
### 插件规范

---

我们为每个类型的插件定义了接口和规范，开发者需要实现我们的接口并按照相应的规范进行开发插件，这样能保证任何插件可以无缝嵌入到我们的 pipeline 中，有关更多插件规范的信息，请移步[这里](https://alibaba.github.io/pipcook/doc/开发者手册-zh)


<a name="08576523"></a>
### 插件解析组件 (Component)

---

对于每个插件，我们需要把它传入相应类型的解析器进行解析，对于上述7种类型的插件会有10种类型的解析器，他们分别是:

```typescript
function DataCollect(plugin: EscherPlugin, params: object);
function DataAccess(plugin: EscherPlugin, params: object);
function DataProcess(plugin: EscherPlugin, params: object);
function ModelLoad(plugin: EscherPlugin, params: object);
function ModelTrain(plugin: EscherPlugin, params: object);
function ModelEvaluate(plugin: EscherPlugin, params: object);
function ModelDeploy(plugin: EscherPlugin, params: object);
```


<a name="7500af07"></a>
### 使用插件

---

pipcook 的插件分为内置插件和第三方插件，每个插件都是一个独立的 npm 包，对于所需的插件，需要独立安装，例如，我们需要一个载入 MobileNet 的模型插件，我们可以在工程目录中使用如下命令安装，**我们会将内置插件直接集成到一个 pipcook 脚手架工程里，您不需要单独安装这些内置插件**

```typescript
npm install mobileNetModelLoad --save
```


<a name="13f272df"></a>
### 插件列表

---

如下是目前 pipcook 支持的插件列表


<a name="a8ab2a0c"></a>
#### Data Collect
| Name | Description |
| --- | --- |
| [@pipcook/pipcook-plugins-image-class-data-collect](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-image-class-data-collect-zh) | 将本地或者远程图片收集进来，储存为 PASCOL VOC 数据集格式 |
| [@pipcook/pipcook-plugins-image-mnist-data-collect](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-image-mnist-data-collect-zh) | Mnist 手写数据集收集，储存为 PASCOL VOC 数据集格式 |
| [@pipcook/pipcook-plugins-image-detection-data-collect](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-image-detection-data-collect-zh) | 将本地或者远程的目标检测数据收集进来，存储为 PASCOL VOC 数据集格式 |
| [@pipcook/pipcook-plugins-text-class-data-collect](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-text-class-data-collect-zh) | 将本地或者远程的分本分类的数据收集进来，存储为 csv 数据格式 |
| [@pipcook/pipcook-plugins-image-coco-data-collect](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-image-coco-data-collect-zh) | 将本地或者远程的 coco format 的目标检测数据收集进来，存储为 PASCOL VOC 数据格式 |



<a name="f8aacfa5"></a>
#### Data Access
| Name | Description |
| --- | --- |
| [@pipcook/pipcook-plugins-image-class-data-access](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-image-class-data-access-zh) | 图片分类数据接入 |
| [@pipcook/pipcook-plugins-text-csv-data-access](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-text-csv-data-access-zh) | 文本分类数据接入 |
| [@pipcook/pipcook-plugins-image-detection-data-access](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-image-detection-data-access-zh) | 基于 tfjs 的简单目标检测数据接入 |
| [@pipcook/pipcook-plugins-detection-detectron-data-access](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-detection-detectron-data-access-zh) | 基于 detectron2 的目标检测模型接入 |
|  |  |



<a name="7475a7cc"></a>
#### Data Process
| Name | Description |
| --- | --- |
| [@pipcook/pipcook-plugins-image-class-data-process](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-image-class-data-process-zh) | 图片分类数据预处理 |
| [@pipcook/pipcook-plugins-text-class-data-process](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-text-class-data-process-zh) | 文本分类数据分词预处理 |



<a name="2aa2d88a"></a>
#### Model Load
| Name | Description |
| --- | --- |
| [@pipcook/pipcook-plugins-local-mobilenet-model-load](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-local-mobilenet-model-load-zh) | MobileNet 模型加载 |
| [@pipcook/pipcook-plugins-bayesian-classifier-model-load](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-bayesian-classifier-model-load-zh) | 贝叶斯分类器加载 |
| [@pipcook/pipcook-plugins-simple-cnn-model-load](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-simple-cnn-model-load-zh) | 简单 CNN 模型加载 |
| [@pipcook/pipcook-plugins-detection-detectron-model-load](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-detection-detectron-model-load-zh) | 基于 detectron2 的目标检测模型加载 |



<a name="a264a20f"></a>
#### Model Train
| Name | Description |
| --- | --- |
| [@pipcook/pipcook-plugins-model-train](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-model-train-zh) | 通用的 tfjs 模型训练 |
| [@pipcook/pipcook-plugins-bayesian-classifier-model-train](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-bayesian-classifier-model-train-zh) | 贝叶斯模型训练 |
| [@pipcook/pipcook-plugins-detection-detectron-model-train](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-detection-detectron-model-train-zh) | 基于 detectron2 的目标检测模型训练 |



<a name="c9320ee5"></a>
#### Model Evaluate
| Name | Description |
| --- | --- |
| [@pipcook/pipcook-plugins-class-model-evaluate](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-class-model-evaluate-zh) | 分类模型评估 |
| [@pipcook/pipcook-plugins-detection-detectron-model-evaluate](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-detection-detectron-model-evaluate-zh) | 基于 detectron2 的目标检测模型评估 |
|  |  |


<a name="OwxaN"></a>
#### Model Deploy

| Name | Description |
| --- | --- |
| [@pipcook/pipcook-plugins-text-class-local-model-deploy](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-text-class-local-model-deploy-zh) | 文本分类本地部署 |
| [@pipcook/pipcook-plugins-image-class-local-model-deploy](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-image-class-local-model-deploy-zh) | 图片分类本地部署 |
| [@pipcook/pipcook-plugins-detection-detectron-model-deploy](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-detection-detectron-model-deploy-zh) | 目标检测本地部署 |


