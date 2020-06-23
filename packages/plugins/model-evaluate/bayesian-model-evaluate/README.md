# @pipcook/plugins-bayesian-model-evaluate

### Description

This plugin will be used to evaluate the Naive Bayes classifier model. The model is generally defined by [@pipcook/plugins-bayesian-model-define](https://www.npmjs.com/package/@pipcook/plugins-bayesian-model-define).

### Required Parameters

| Parameter | Type | Description |
|:----------|:-----|:------------|


### Optional Parameters

| Parameter | Type | Default Value | Description |
|:----------|:-----|:------|:-----|
|expectAccuracy|number|null|expected accuracy given by model.|

### Example
```json
"modelTrain": {
  "package": "@pipcook/plugins-bayesian-model-evaluate",
  "params": {
    "expectAccracy": 0.9
  }
},
```
