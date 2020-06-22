# @pipcook/plugins-tfjs-simplecnn-model-define

### Description

This plugin defines a image classification model. This model is built on top of several convolutional blocks. This model is fit for quite simple dataset. The model is built using Tensorflow.js.

### Necessary Parameters

| Parameter | Type | Description |
|:----------|:-----|:------------|


### Optional Parameters

| Parameter | Type | Default Value | Description |
|:----------|:-----|:------|:-----|
|loss|string|categoricalCrossentropyloss|the loss function to be defined. [Look more](https://js.tensorflow.org/api/latest/#Training-Losses)|
|metrics|string[]|[ 'accuracy' ]|metrics used to evaluate model. [Look more](https://js.tensorflow.org/api/latest/#Metrics)|
|recoverPath|string|null|Recover path of pretrained model|
|outputShape|number[]|null|outputshape of model, only specified when recoverPath is specified|
|labelMap|object|null|label map, only specified when recoverPath is specified|

### Example
```json
"modelDefine": {
  "package": "@pipcook/plugins-tfjs-simplecnn-model-define"
},
```
