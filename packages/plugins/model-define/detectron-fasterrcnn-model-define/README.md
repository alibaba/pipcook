# @pipcook/plugins-detectron-fasterrcnn-model-define

### Description

This plugin defines object detection model. This model is [fasterrcnn](https://arxiv.org/abs/1506.01497). The whole staff is built on top on [detectron2](https://github.com/facebookresearch/detectron2).


### Necessary Parameters

| Parameter | Type | Description |
|:----------|:-----|:------------|


### Optional Parameters

| Parameter | Type | Default Value | Description |
|:----------|:-----|:------|:-----|
|baseLearningRate|number|0.00025|base learning rate|
|numWorkers|number|0|workers for data loader.|
|numClasses|number|0|Number of classes of dataset. Only specify this value when you provide your own model. Otherwise just leave as 0|
|recoverPath|string|null|path to model pretrained|


### Example
```json
"modelDefine": {
  "package": "@pipcook/plugins-detectron-fasterrcnn-model-define"
},
```
