# @pipcook/plugins-bayesian-model-train

### Description

This plugin will be used to train the Naive Bayes classifier model. The model is generally defined by [@pipcook/plugins-bayesian-model-define](https://www.npmjs.com/package/@pipcook/plugins-bayesian-model-define). This plugin supports both English and Chinese which are configured by 'mode' parameter.


### Required Parameters

| Parameter | Type | Description |
|:----------|:-----|:------------|


### Optional Parameters

| Parameter | Type | Default Value | Description |
|:----------|:-----|:------|:-----|
|mode|string|cn|Chinese text classification or English text classification, the value can be en or cn|

### Example
```json
"modelTrain": {
  "package": "@pipcook/plugins-bayesian-model-train"
},
```
