<a name="6WNZz"></a>
## 图片分类
我们内置了多个插件可以组合完成一个图片分类的 pipeline， 下面我们通过介绍各个环节的插件来详细介绍这条 pipeline 是怎么完成工作的，相关代码您可以在[这里](https://github.com/alibaba/pipcook/blob/master/example/pipeline-databinding-image-classification.js)找到
<a name="5qFXQ"></a>
#### Data Collect
我们内置了两个与图片分类有关的插件。

第一个是[@pipcook/pipcook-plugins-image-mnist-data-collect](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-image-mnist-data-collect-zh), 这个插件是特别为收集 mnist 图片数据，主要是为了用户可以快速体验 pipcook 而设置的经典样例数据集。此插件将下载 mnist 数据并收集成为我们标准的[数据集格式](https://alibaba.github.io/pipcook/doc/数据集-zh)。

第二个[@pipcook/pipcook-plugins-image-class-data-collect](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-image-class-data-collect-zh), 这个插件是更为通用的图片分类数据收集插件，用于可以使用此插件来下载自己的数据集。此插件接受一个 url 或者 本地路径下载一个用户的压缩文件，这个压缩文件包含 train/validation/test 文件夹，每个文件夹包含若干个分类名称的文件夹，下面有着此分类的图片，用户只要按照这种格式将他们的数据打包上传至某处或者存在本地，再使用这个插件，便可成功收集。

<a name="BuVDD"></a>
#### Data Access
我们提供了内置的图片分类数据接入插件 [@pipcook/pipcook-plugins-image-class-data-access](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-image-class-data-access-zh)<br />我们认为在经过 Data Collect 插件之后，图片分类已经具有了标准数据集格式，此插件将这种标准格式接入 pipeline，转化为 tf.data 形式的批量数据，供下游使用训练

<a name="Diid7"></a>
#### Data Process
我们提供了内置的图片分类数据处理插件[@pipcook/pipcook-plugins-image-class-data-process](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-image-class-data-process-zh), 此插件提供对图片进行简单的处理功能，包括归一化，旋转，变换色彩等。用户可以使用此插件在图片数据进入模型之前来对数据进行一些处理。

<a name="ovECv"></a>
#### Model Load
对于图片分类问题我们内置了两个插件来供用户选择 [@pipcook/pipcook-plugins-local-mobilenet-model-load](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-local-mobilenet-model-load-zh) 和[@pipcook/pipcook-plugins-simple-cnn-model-load](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-simple-cnn-model-load-zh)。

@pipcook/pipcook-plugins-simple-cnn-model-load 会加载一个包含5个卷积层的 CNN 网络，此网络主要是用来对一些简单的图片进行分类，而@pipcook/pipcook-plugins-local-mobilenet-model-load 回加载 MobileNet v1 网络，可以用来处理一些更为复杂的问题

<a name="HeXlz"></a>
#### Model Train
我们提供了内置的模型训练插件 [@pipcook/pipcook-plugins-model-train](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-model-train-zh)， 此插件主要是启动上一环节加载的模型和相关的数据进行模型训练的

<a name="DdEm9"></a>
#### Model Evaluate
我们提供了内置的模型评估插件 [@pipcook/pipcook-plugins-model-evaluate,](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-class-model-evaluate-zh) 此插件主要是读入之前的数据中的测试集的部分(如果有)和训练好的模型，对模型的表现进行评估，对于标准的 TfJs 的模型，将会返回根据设定的 metrics 指标

<a name="fa4Uv"></a>
#### Model Deploy
目前我们内置了将训练好的模型部署到本地的插件 

<a name="D4TgZ"></a>
## 目标检测
我们内置了多个插件可以组合完成一个目标检测的 pipeline， 注意，此目标检测链路基于 facebook 的开源框架 detectron， 此框架依赖 python 环境，如果想要使用我们的桥接链路，请参考[此篇](https://alibaba.github.io/pipcook/doc/想要使用python？-zh)进行环境配置，下面我们通过介绍各个环节的插件来详细介绍这条 pipeline 是怎么完成工作的, 相关代码您可以在[这里](https://github.com/alibaba/pipcook/blob/master/example/pipeline-object-detection.js)找到
<a name="5HEOk"></a>
#### Data Collect
我们内置了目标检测的 coco data format 的数据收集插件 [@pipcook/pipcook-plugins-image-coco-data-collect](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-image-coco-data-collect-zh), 此插件是通用的收集目标检测问题数据插件，此插件接受一个 url 或者 本地路径，可以为远程或者本地。使用本地路径，需要在路径前加上 file:// , 路径应该指向一个 zip 压缩文件，这个压缩文件包含一个 image 文件夹和一个 json 注解文件， image 文件夹里有所有图片，注解文件为 coco format 的注解，关于更多 coco format 的信息，可以参考这里
<a name="SwqAD"></a>
#### Data Access
我们提供了内置的 detectron2 目标检测数据接入插件 [@pipcook/pipcook-plugins-detection-detectron-data-access](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-detection-detectron-data-access-zh)<br />此插件用于 detectron2 训练的链路中数据接入的部分，此插件将会把数据接入为 detectron2 接受的数据

<a name="B3GtH"></a>
#### Model Load
我们提供了内置的目标检测模型载入插件[@pipcook/pipcook-plugins-detection-detectron-model-load](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-detection-detectron-model-load-zh) 载入一个目标检测模型

<a name="Ye7qy"></a>
#### Model Train
我们提供了内置的模型训练插件 [@pipcook/pipcook-plugins-detection-detectron-model-train](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-detection-detectron-model-train-zh)， 此插件主要是启动上一环节加载的模型和相关的数据进行模型训练的

<a name="WbFYq"></a>
#### Model Evaluate
我们提供了内置的模型评估插件 [@pipcook/pipcook-plugins-detection-detectron-model-evaluate](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-detection-detectron-model-evaluate-zh), 此插件将会对模型通过测试集进行评估


<a name="iNyBx"></a>
## 文本分类
我们内置了多个插件可以组合完成一个文本分类的 pipeline，主要我们这个阶段内置的文本分类是基于传统机器学习贝叶斯分类器的，并非深度模型，此条 pipeline 主要是用来展示 pipcook 也可以用来进行传统机器学习的训练，后续我们期望开发者们可以贡献一条基于深度 nlp 模型的文本分类管道，相关代码您可以在[这里](https://github.com/alibaba/pipcook/blob/master/example/pipeline-text-bayes-classification.js)找到

<a name="NHa7O"></a>
#### Data Collect
我们内置了文本分类的数据收集插件[@pipcook/pipcook-plugins-text-class-data-collect](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-text-class-data-collect-zh), 此插件是通用的收集文本问题数据插件，此插件接受一个 url 或者 本地路径，这个 url 应该指向一个压缩 csv文件，这个文件包含两列，第一列为文本内容，第二列为分类的类别名

<a name="ATWc6"></a>
#### Data Access
我们提供了内置的文本分类数据接入插件 [@pipcook/pipcook-plugins-text-csv-data-access](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-text-csv-data-access-zh)<br />我们认为在经过 Data Collect 插件之后，文本已经具有了标准数据集格式，此插件将这种标准格式接入 pipeline，转化为 tf.data 形式的批量数据，供下游使用训练

<a name="XwrKs"></a>
#### Data Process
我们提供了内置的文本分类处理插件 [@pipcook/pipcook-plugins-text-class-data-process](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-text-class-data-process-zh), 这个插件主要是用来做分词的，对于传统一些分类模型，需要对原来的文本内容进行分词，也相当于一层提取特征的处理。

<a name="BgcQN"></a>
#### Model Load
我们提供了内置的目标检测模型载入插件 [@pipcook/pipcook-plugins-bayesian-classifier-model-load](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-bayesian-classifier-model-load-zh) 载入一个贝叶斯分类器

<a name="MY3ED"></a>
#### Model Train
我们提供了内置的贝叶斯分类器训练插件 [@pipcook/pipcook-plugins-bayesian-classifier-model-train](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-bayesian-classifier-model-train-zh)， 此插件主要是启动上一环节加载的模型和相关的数据进行模型训练的

<a name="8FJjZ"></a>
#### Model Evaluate
我们提供了内置的模型评估插件 [@pipcook/pipcook-plugins-model-evaluate](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-class-model-evaluate-zh), 此插件主要是读入之前的数据中的测试集的部分(如果有)和训练好的模型，对模型的表现进行评估，对于标准的 TfJs 的模型，将会返回根据设定的 metrics 指标
