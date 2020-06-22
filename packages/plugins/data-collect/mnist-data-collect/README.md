# @pipcook/plugins-mnist-data-collect

### Description

This plugin is used to collect MNIST data specifically. For more inforamtion about MNIST, please refer to [here](http://yann.lecun.com/exdb/mnist/).
You can just specify how many samples of MNIST data you would like to collect and we will do the rest for you in this plugin.



### Necessary Parameters

| Parameter | Type | Description |
|:----------|:-----|:------------|
|trainCount|number|how many train samples to collect|
|testCount|number|how many test samples to collect|

### Optional Parameters

| Parameter | Type | Default Value | Description |
|:----------|:-----|:------|:-----|


### Example
```json
"dataCollect": {
  "package": "@pipcook/plugins-mnist-data-collect",
  "params": {
    "url": "http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/1(1).zip"
  }
},
```
