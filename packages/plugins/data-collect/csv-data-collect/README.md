# @pipcook/plugins-csv-data-collect

### Description

This plugin is used to collect CSV dataset. The dataset can be used for tasks with text data, including text classification, text generation and etc.
Notice that the url given by this plugin should be a zip file. The contents inside this zip file should have following structure:

- train
  - [filename].csv
- validation*
  - [filename].csv
- test*
  - [filename].csv


> \* means optional. [filename] means this placeholder could be replaced by your own filename.


### Required Parameters

| Parameter | Type | Description |
|:----------|:-----|:------------|
|url|string|Url or path of your zip file. If it's a local file, add prefix file://|

### Optional Parameters

| Parameter | Type | Default Value | Description |
|:----------|:-----|:------|:-----|


### Example
```json
"dataCollect": {
  "package": "@pipcook/plugins-csv-data-collect",
  "params": {
    "url": "http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textClassification.zip"
  }
}
```
