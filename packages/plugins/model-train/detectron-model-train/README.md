# @pipcook/plugins-detectron-model-train

### Description

This plugin will be used to train any models built on top of [detectron2](https://github.com/facebookresearch/detectron2).


### Necessary Parameters

| Parameter | Type | Description |
|:----------|:-----|:------------|


### Optional Parameters

| Parameter | Type | Default Value | Description |
|:----------|:-----|:------|:-----|
|steps|number|100000|how many steps to train|

### Example
```json
"modelTrain": {
  "package": "@pipcook/plugins-detectron-model-train",
  "params": {
    "steps": 200000
  }
},
```
