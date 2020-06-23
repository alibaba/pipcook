# @pipcook/plugins-tensorflow-mobilenet-model-define

### Description

This plugin defines a image classification model. This model is [mobilenet](https://arxiv.org/abs/1704.04861). The model is built using python tensorflow.

### Required Parameters

| Parameter | Type | Description |
|:----------|:-----|:------------|


### Optional Parameters

| Parameter | Type | Default Value | Description |
|:----------|:-----|:------|:-----|
|loss|string|categorical_crossentropy|the loss function to be defined. [Look more](https://www.tensorflow.org/api_docs/python/tf/keras/losses)|
|metrics|string[]|[ 'accuracy' ]|metrics used to evaluate model. [Look more](https://www.tensorflow.org/api_docs/python/tf/keras/metrics)|
|learningRate|number|0.001|base learning rate for Adam|
|decay|number|0.05|decay rate for Adam|
|freeze|boolean|false|Whether to freeze first several layers|
|labelMap|object|null|label map, only specified when recoverPath is provided|
|recoverPath|string|null|Recover path of pretrained model|


### Example
```json
"modelDefine": {
  "package": "@pipcook/plugins-tensorflow-mobilenet-model-define",
  "params": {
    "freeze": true
  }
},
```
