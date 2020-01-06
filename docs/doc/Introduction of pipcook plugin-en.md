pipcook uses plugins to implement tasks in a specific machine learning cycle, which ensures that our core is simple, stable, and efficient enough. At the same time, through a set of plug-n specifications defined by pipcook, we can also allow third parties to develop plugins, which ensures the scalability of pipcook. Theoretically, through plugins, we can implement any machine learning task.


<a name="f64c5b65"></a>
### Plugin type

---

We have defined seven types of machine learning lifecycle plug-ins:

- Data Collect:   data from different sources can be collected and stored in a unified dataset format, for more information about the dataset standards required by pipcook, see here.
- Data Access: this plugin access data to pipcook in the expected dataset format. It also describes and verifies samples to ensure that a high-quality dataset is used.
- Data Process: process Data
- Model Load: this plugin loads the model into the pipeline and eliminates the differences between models such as keras and python tf.
- Model Train: train models
- Model Evaluate: evaluate the Model
- Model Deploy: deploy the Model

<a name="7642472a"></a>
### Plugin features

---

- Scalability: pipcook's capabilities are constantly extended through new plugins.
- Plugin pluggability: the input and output of each type of plugin must comply with our prototype specifications, and all plugins must inherit the prototypes of each type, this ensures that each one is pluggable and replaceable, and developers can develop third-party plug-ins to insert according to the specifications.
- Combination of plugins: not every life cycle in the pipeline is required, as long as the plugins with input and output can be combined together. This provides maximum flexibility in configuration and combination. For example, if you do not want to train a model but just want to evaluate another person's model with your own data, you can pull out the Model Train so that the Model Load can be directly linked to the Model Evaluate.

<a name="ff93a5f0"></a>
### Plugin Specification

---

We have defined interfaces and specifications for each type of plugins. Developers need to implement our interfaces and develop plug-ins according to the corresponding specifications, this ensures that any plugin can be seamlessly embedded into our pipeline. For more information about plugin specifications, please move [Here](https://alibaba.github.io/pipcook/doc/developer guide-en)


<a name="08576523"></a>
### Plugin parsing Component

---

For each plug-in, we need to pass it into the corresponding type of parsers for parsing. For the above 10 types of plug-ins, there are 7 types of parsers:

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
### Use plugins

---

Pipcook plugins are divided into built-in plugins and third-party plugins. Each plugin is an independent npm package, and the required plugins need to be installed independently. For example, we need a model plugin loaded with MobileNet, we can use the following command in the project directory to install, **We will integrate the builtin plugins directly into a pipcook scaffold project. You do not need to install these builtin plugins separately.**

```typescript
npm install mobileNetModelLoad --save
```


<a name="13f272df"></a>
### Plugin list

---

The following is a list of plug-ins currently supported by pipcook.

<a name="brPiu"></a>
#### Data Collect

| Name | Description |
| --- | --- |
| [@pipcook/pipcook-plugins-image-class-data-collect](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-image-class-data-collect-en) | Collect local or remote images and store them in pascol voc dataset format |
| [@pipcook/pipcook-plugins-image-mnist-data-collect](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-image-mnist-data-collect-en) | Mnist handwritten dataset collection, stored in pascol voc dataset format |
| [@pipcook/pipcook-plugins-image-detection-data-collect](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-image-detection-data-collect-en) | Collect local or remote target detection data and store them in pascol voc dataset format |
| [@pipcook/pipcook-plugins-text-class-data-collect](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-text-class-data-collect-en) | Collect local or remote data of this classification and store it in csv data format |
| [@pipcook/pipcook-plugins-image-coco-data-collect](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-image-coco-data-collect-en) | Collect local or remote object detection data in coco format and store it in pascol voc data format |


<a name="4zcpH"></a>
#### Data Access

| Name | Description |
| --- | --- |
| [@pipcook/pipcook-plugins-image-class-data-access](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-image-class-data-access-en) | Image classification data access |
| [@pipcook/pipcook-plugins-text-csv-data-access](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-text-csv-data-access-en) | Text classification data access |
| [@pipcook/pipcook-plugins-image-detection-data-access](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-image-detection-data-access-en) | Simple target detection data access based on tfjs |
| [@pipcook/pipcook-plugins-detection-detectron-data-access](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-detection-detectron-data-access-en) | Object detection model access based on detectron2 |
|  |  |


<a name="Nko4U"></a>
#### Data Process

| Name | Description |
| --- | --- |
| [@pipcook/pipcook-plugins-image-class-data-process](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-image-class-data-process-en) | Image classification data preprocessing |
| [@pipcook/pipcook-plugins-text-class-data-process](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-text-class-data-process-en) | Text Classification Data Word Segmentation preprocessing |


<a name="4G74y"></a>
#### Model Load

| Name | Description |
| --- | --- |
| [@pipcook/pipcook-plugins-local-mobilenet-model-load](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-local-mobilenet-model-load-en) | MobileNet model loading |
| [@pipcook/pipcook-plugins-bayesian-classifier-model-load](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-bayesian-classifier-model-load-en) | Loading of Bayes classifier |
| [@pipcook/pipcook-plugins-simple-cnn-model-load](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-simple-cnn-model-load-en) | Simple CNN model loading |
| [@pipcook/pipcook-plugins-detection-detectron-model-load](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-detection-detectron-model-load-en) | Loading of object detection model based on detectron2 |


<a name="QBOwZ"></a>
#### Model Train

| Name | Description |
| --- | --- |
| [@pipcook/pipcook-plugins-model-train](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-model-train-en) | General tfjs model training |
| [@pipcook/pipcook-plugins-bayesian-classifier-model-train](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-bayesian-classifier-model-train-en) | Bayes model training |
| [@pipcook/pipcook-plugins-detection-detectron-model-train](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-detection-detectron-model-train-en) | Target detection model training based on detectron2 |



<a name="Yluwg"></a>
#### Model Evaluate

| Name | Description |
| --- | --- |
| [@pipcook/pipcook-plugins-class-model-evaluate](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-class-model-evaluate-en) | Classification Model Evaluation |
| [@pipcook/pipcook-plugins-detection-detectron-model-evaluate](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-detection-detectron-model-evaluate-en) | Evaluation of target detection model based on detectron2 |



<a name="RsVBT"></a>
#### Model Deploy

| Name | Description |
| --- | --- |
| [@pipcook/pipcook-plugins-text-class-local-model-deploy](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-text-class-local-model-deploy-en) | Text Classification local deployment |
| [@pipcook/pipcook-plugins-image-class-local-model-deploy](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-image-class-local-model-deploy-en) | Image classification local deployment |
| [@pipcook/pipcook-plugins-detection-detectron-model-deploy](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-detection-detectron-model-deploy-en) | Target Detection local deployment |

