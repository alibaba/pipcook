此插件用于文本分类管道中将文本数据收集进来并以一定的数据集格式存储 (csv)


<a name="c8ad2b59"></a>
#### pipcook 插件类别：

Data Collect


<a name="0ae9da20"></a>
#### 参数:

- url (string): csv文件的路径。要求此路径指向一个 .csv 格式的压缩文件，文件包含两列，第一列为文本数据，第二列为类别。此 url 可以是远程或者本地，如果是本地路径，需要使用 file://${您的路径}
- hasHeader (boolean)[可选]: 默认为false，如果有header， 指定为true
- delimiter (string)[可选]: 默认为 ',', 分隔符
- validationSplit (number)[可选]: 默认为0， 有多少比例划分为验证集，范围0-1
- testSplit (number)[可选]: 默认为0， 有多少比例划分为测试集，范围0-1

<a name="587da97d"></a>
#### 例子:

数据压缩文件储存在本地的时候

```typescript
const dataCollect = DataCollect(textClassDataCollect, {
  url: 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textDataBinding.csv',
  validationSplit:0.1,
  testSplit:0.1
})
```
