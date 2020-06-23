# @pipcook/plugins-image-classification-tfjs-model-train

### Description

This plugin will be used to train image classification models built on top of Tensorflow.js.


### Required Parameters

| Parameter | Type | Description |
|:----------|:-----|:------------|


### Optional Parameters

| Parameter | Type | Default Value | Description |
|:----------|:-----|:------|:-----|
|epochs|number|10|how many epochs to train|
|batchSize|number|16|data's batch size to be trained for every iteration|


### Example
```json
"modelTrain": {
  "package": "@pipcook/plugins-image-classification-tfjs-model-train",
  "params": {
    "epochs": 15
  }
}
```
