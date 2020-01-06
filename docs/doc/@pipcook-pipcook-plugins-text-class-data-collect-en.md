This plugin is used to collect text data in the text classification pipeline and store it in a certain dataset format (csv)

<a name="c8ad2b59"></a>
#### Pipcook plugin Category:
Data Collect


<a name="0ae9da20"></a>
#### Parameters:

- url (string): the path of the csv file. This path is required to point to a. csv compressed file. The file contains two columns, the first column is text data, and the second column is category. This url can be remote or local. If it is a local path, use file: // $ {your path}
- hasHeader (boolean) [optional]: false by default. If a header exists, true is specified.
- delimiter (string) [optional]: The default value is ',', delimiter
- validationSplit (number) [optional]: The default value is 0. How many ratios are divided into validation sets, ranging from 0 to 1
- testSplit (number) [optional]: The default value is 0. How many ratios are divided into test sets, ranging from 0 to 1

<a name="587da97d"></a>
#### Example:
When a compressed data file is stored locally

```typescript
const dataCollect = DataCollect(textClassDataCollect, {
  url: 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textDataBinding.csv',
  validationSplit:0.1,
  testSplit:0.1
})
```
