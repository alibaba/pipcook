# Pipelines

[English](./README.md)

## 贝叶斯-文本分类

### 数据集

文本分类 Pipeline 的数据集组织格式如下：

```sh
.
├── test
│   └── textDataBinding.csv
└── train
    └── textDataBinding.csv
```

`train` 文件夹内是训练数据，`test` 文件夹内是测试数据，存储为 csv 格式。csv 文件内有两列数据，分别为 input 和 output，input 为样本数据，output 为样本标签，如：

| input                                                        | output    |
| ------------------------------------------------------------ | --------- |
| 原创春秋新款宽松黑色牛仔裤男贴布哈伦裤日系潮流胖男大码长裤子 | itemTitle |
| 茗缘翡翠                                                     | shopName  |
| 挂画精美 种类丰富                                            | itemDesc  |

这3个样本表示了3类不同的文本，他们的标签分别是`itemTitle`，`shopName`，`itemDesc`。需要注意的是，数据集中的数据需要尽可能丰富，且分布相对均匀，也就是说每个类别的样本数量应该差不多，差异过大将影响模型的准确度。

数据源可以为本地文件夹路径:

```json
{
  "datasource": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@e5503a0/scripts/text-classification-bayes/build/datasource.js?url=file:///path/to/dataset-directory"
}
```

`/path/to/dataset-directory` 内包含 `test` 和 `train` 文件夹。

或者可以将 `test` 和 `train` 目录压缩成 zip 文件，存储在 OSS 上，修改数据源为 zip 文件 url:

```json
{
  "datasource": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@e5503a0/scripts/text-classification-bayes/build/datasource.js?url=http:///oss-host/my-dataset.zip"
}
```

### 模型参数

贝叶斯模型支持中文和英文两种模式，可以通过 `mode` 参数指定 `cn` 或者 `en`，默认为 `cn`。

```json
{
  "model": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@e5503a0/scripts/text-classification-bayes/build/model.js?mode=en"
}
```

由于贝叶斯模型使用了一些 `tfjs-backend-cpu` 上的算子，其他 backend 目前还未支持，所以在 `options` 字段中，我们定义了模型训练的 backend 为 `@tensorflow/tfjs-backend-cpu`。

## ResNet/MobileNet-图片分类

### 数据集

图片分类 Pipeline 的数据集组织格式如下：

```sh
.
├── test
│   ├── class-1
│   └── class-2
├── train
│   ├── class-1
│   └── class-2
└── validation
│   ├── class-1
│   └── class-2
```

`train` 文件夹内是训练数据，`test` 文件夹内是测试数据，`validation` 文件夹内是验证数据，目录中为各类别的图片文件夹，文件夹名称即图片的类别。

数据源可以使本地文件夹路径:

```json
{
  "datasource": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@e5503a0/scripts/image-classification/build/datasource.js?url=file:///path/to/dataset-directory"
}
```

`/path/to/dataset-directory` 内包含 `test` 和 `train` 文件夹。

也可以把样本目录压缩成 zip 文件，存储在 OSS 上，修改数据源为 zip 文件 url:

```json
{
  "datasource": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@e5503a0/scripts/image-classification/build/datasource.js?url=http://oss-host/dataset.zip"
}
```

### 数据处理

对于图片分类任务来说，输入模型的所有样本图片维度（长宽）必须是一致的，而我们预定义的 MobileNet 和 ResNet 模型都要求输入 224 * 224 的图片，因此在模型训练开始前，我们会通过 `dataflow` 脚本对图片进行 resize 操作：
```json
{
  "dataflow": [
    "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@e5503a0/scripts/image-classification/build/dataflow.js?size=224&size=224"
  ]
}
```

### 模型参数

图片分类 pipeline 支持 MobileNet 和 ResNet 两种模型，`modelUrl` 参数指定 `mobilenet` 或者 `resnet`，默认为 `mobilenet`。

```json
{
  "model": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@e5503a0/scripts/image-classification/build/model.js?modelUrl=resnet",
}
```

另外，`options` 字段可以配置是否启用 GPU，训练的 epochs:

```json
{
  "options": {
    "framework": "tfjs@3.8",
    "gpu": false,
    "train": {
      "epochs": 10
    }
  }
}
```

GPU 默认为启用。epochs 越大，训练时长越久。

## YOLO-目标检测

### 数据集

目标检测 Pipeline 支持 [PascalVoc](../../docs/zh-cn/spec/dataset.md) 和 [Coco](https://cocodataset.org/#format-data) 两种数据集格式，通过定义 `format` 参数为 `pascalvoc` 或 `coco` 来指定当前数据集格式：

```json
{
  "datasource": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@e5503a0/scripts/object-detection-yolo/build/datasource.js?format=pascalvoc&url=https://host/dataset.zip"
}
```

同样的，如果在本地训练，可以将数据源改为本地文件夹路径:

```json
{
  "datasource": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@e5503a0/scripts/object-detection-yolo/build/datasource.js?format=pascalvoc&url=file:///path/to/dataset-directory"
}
```

### 数据处理

和图片分类 pipeline 一样，YOLO 要求输入模型的所有样本图片维度（长宽）必须是一致的，为 416 * 416，因此在模型训练开始前，我们会通过 `dataflow` 脚本对图片进行 resize 操作：
```json
{
  "dataflow": [
    "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@e5503a0/scripts/object-detection-yolo/build/dataflow.js?size=416&size=416"
  ]
}
```

### 模型参数

`options` 字段可以配置目标检测 pipeline 是否启用 GPU，训练的 epochs，每次喂入模型的样本数量 batchSize 以及 early-stopping 的 patience 值:

```json
{
  "options": {
    "framework": "tfjs@3.8",
    "gpu": false,
    "train": {
      "epochs": 100,
      "batchSize": 16,
      "patience": 10
    }
  }
}
```

GPU 默认为启用。`patience` 表示 loss 在 patience 个 epoch 没有下降后停止训练。比如 `patience` 为 3 的情况下，如果连续出现 3 个 epoch loss 都没有下降，就会触发 early-stopping，训练会提前终止。
