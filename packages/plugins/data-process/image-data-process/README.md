# @pipcook/plugins-image-data-process

### Description

This plugin is used to process image data. This means we will do some modifications on the original image data you provide from data-collect.
These operations include resize, normalize and etc.


### Required Parameters

| Parameter | Type | Description |
|:----------|:-----|:------------|


### Optional Parameters

| Parameter | Type | Default Value | Description |
|:----------|:-----|:------|:-----|
|resize|number[]| [256, 256] |the scale to resize|

### Example
```json
"dataProcess": {
  "package": "@pipcook/plugins-image-data-process",
  "params": {
    "resize": [256, 256]
  }
},
```
