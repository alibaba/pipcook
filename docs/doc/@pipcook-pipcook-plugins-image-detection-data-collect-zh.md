此插件用于目标检测管道中将图片收集进来并以一定的数据集格式存储 (PASCOL VOC)


<a name="c8ad2b59"></a>
#### pipcook 插件类别：

Data Collect


<a name="0ae9da20"></a>
#### 参数:

- url (string): 图片的路径。要求此路径指向一个 .zip 格式的压缩文件。此 url 可以是远程或者本地，如果是本地路径，需要使用 file://${您的路径}压缩文件包含两个文件夹，分别是 annotations, images. annotations 文件夹包含所有的 xml 注解， images 包含所有的图片，可以参考[这里](http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/componentRecognition.zip)下载此插件适合的样例数据
- validationSplit (number)[可选]: 默认为0， 0-1， 有多少比例被划分为验证集
- testSplit (number)[可选]： 默认为0， 0-1， 有多少比例划分为测试集

<a name="587da97d"></a>
#### 例子:

数据压缩文件储存在远程的时候

```typescript
const dataCollect = DataCollect(imageDetectionDataCollect, {
  url: 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/componentRecognition.zip',
  testSplit: 0.1
});
```
