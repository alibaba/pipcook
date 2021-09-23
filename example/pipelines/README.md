# Pipelines

<p align="center">
  <a href="https://alibaba.github.io/pipcook/tree/main/README-CN.md">中文</a>
</p>

## Bayesian Text Classification

### Dataset

The dataset for the text classification Pipeline is organized in the following format:

```sh
.
├── test
│   └── textDataBinding.csv
└── train
    └── textDataBinding.csv
```

The `train` folder contains the training data, and the `test` folder contains the test data, stored in csv format. The csv files have two columns of data, `input` and `output`, `input` is the sample data and `output` is the sample label, e.g:

| input                                                        | output    |
| ------------------------------------------------------------ | --------- |
| 原创春秋新款宽松黑色牛仔裤男贴布哈伦裤日系潮流胖男大码长裤子 | itemTitle |
| 茗缘翡翠                                                     | shopName  |
| 挂画精美 种类丰富                                            | itemDesc  |

These 3 samples represent 3 different categories of text, and their labels are `itemTitle`, `shopName`, and `itemDesc`. It should be noted that the data in the dataset needs to be as rich as possible and relatively evenly distributed, which means that the number of samples in each category should be about the same, too much difference will affect the accuracy of the model.

You can change the data source to the local folder path, like:

```json
{
  "datasource": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@d4bdfde/scripts/text-classification-bayes/build/datasource.js?url=file:///path/to/dataset-directory"
}
```

The `/path/to/dataset-directory` contains the `test` and `train` folders.

Also, you can compress the `test` and `train` directories into a zip file and store it on the OSS, modifying the `url` to the zip file url:

```json
{
  "datasource": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@d4bdfde/scripts/text-classification-bayes/build/datasource.js?url=http:///oss-host/my-dataset.zip"
}
```

### Model Parameters

Bayesian model supports both Chinese and English modes, you can specify `cn` or `en` by `mode` parameter, the default is `cn`.

```json
{
  "model": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@d4bdfde/scripts/text-classification-bayes/build/model.js?mode=en"
}
```

Since the Bayesian model uses some operators on `tfjs-backend-cpu` and other backends are not currently supported, in the `options` field we define the backend for model training as `@tensorflow/tfjs-backend-cpu`.

## ResNet/MobileNet Image Classification

### Dataset

The dataset for the image classification Pipeline is organized in the following format:

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

The `train` folder contains the training data, the `test` folder contains the test data, the `validation` folder contains the validation data, and the directory contains the image folders for each category, the folder name is the category of the image.

You can specify the `url` to the local folder path:

```json
{
  "datasource": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@460ecdb/scripts/image-classification/build/datasource.js?url=file:///path/to/dataset-directory"
}
```

The `/path/to/dataset-directory` contains the `test` and `train` folders.

Or http url:

```json
{
  "datasource": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@460ecdb/scripts/image-classification/build/datasource.js?url=http://oss-host/dataset.zip"
}
```

### Data Processing

For the image classification task, the dimension (width and height) of all sample images input to the model must be the same, and our predefined MobileNet and ResNet models both require a 224 * 224 image input, so before model training begins, we perform a resize operation on the images via the `dataflow` script.
```json
{
  "dataflow": [
    "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@460ecdb/scripts/image-classification/build/dataflow.js?size=224&size=224"
  ]
}
```

### Model Parameters

The image classification pipeline supports both MobileNet and ResNet models. The `modelUrl` parameter specifies `mobilenet` or `resnet`, the default is `mobilenet`.

```json
{
  "model": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@460ecdb/scripts/image-classification/build/model.js?modelUrl=resnet",
}
```

In addition, the `options` field can be configured to enable or disable the GPU, and the epochs for training:

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

GPU is enabled by default. The larger the epochs, the longer the training time.

## YOLO Object Detection

### Dataset

Object Detection pipeline supports [PascalVoc](../../docs/spec/dataset.md) and [Coco](https://cocodataset.org/#format-data), specifying the current dataset format by defining the `format` parameter as `pascalvoc` or `coco`.

```json
{
  "datasource": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@460ecdb/scripts/object-detection-yolo/build/datasource.js?format=pascalvoc&url=https://host/dataset.zip"
}
```

You can specify the `url` as a local folder path:

```json
{
  "datasource": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@460ecdb/scripts/object-detection-yolo/build/datasource.js?format=pascalvoc&url=file:///path/to/dataset-directory"
}
```

### Data Processing

As with the image classification pipeline, YOLO requires that the dimension (width and height) of all sample images input to the model must be the same, 416 * 416, so before the model training begins, we perform a resize operation on the images with the `dataflow` script.
```json
{
  "dataflow": [
    "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@460ecdb/scripts/object-detection-yolo/build/dataflow.js?size=416&size=416"
  ]
}
```

### Model Parameters

The `options` field allows you to configure whether the object detection pipeline is GPU-enabled, the epochs for training, the number of samples to be fed into the model per batchSize, and the patience value for early-stopping:

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

GPU is enabled by default. `patience` indicates that the loss stops training after patience epochs of no decline. For example, if `patience` is 3, if there is no drop in loss for 3 epochs, early-stopping will be triggered and training will be terminated early.
