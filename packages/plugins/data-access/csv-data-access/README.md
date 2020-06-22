# @pipcook/plugins-csv-data-access

### Description

This plugin is used to access csv data. You should provide and tell the model which column will be used for label.


### Necessary Parameters

| Parameter | Type | Description |
|:----------|:-----|:------------|
|labelColumn|string|which column in the csv file will be used for label.|

### Optional Parameters

| Parameter | Type | Default Value | Description |
|:----------|:-----|:------|:-----|


### Example
```json
"dataAccess": {
  "package": "@pipcook/plugins-csv-data-access",
  "params": {
    "labelColumn": "output"
  }
},
```
