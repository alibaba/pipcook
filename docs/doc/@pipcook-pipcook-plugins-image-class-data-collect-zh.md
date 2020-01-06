此插件用于图片分类管道中将图片收集进来并以一定的数据集格式存储 (PASCOL VOC)

<a name="klNlr"></a>
#### pipcook 插件类别：
Data Collect

<a name="xzxwP"></a>
#### 参数: 

- url (string): 图片的路径。要求此路径指向一个 .zip 格式的压缩文件，压缩文件包含三个文件夹，分别是 train, validation(可选), test (可选), 每个文件夹包含您所有分类类别的文件夹, 每个类别文件夹里是您的图片。此 url 可以是远程或者本地，如果是本地路径，需要使用 file://${您的路径}
<a name="2e1Vr"></a>
#### 例子:
数据压缩文件储存在远程的时候
```typescript
const dataCollect = DataCollect(imageClassDataCollect, {
   url: 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/eCommerceImageClassification.zip'
});
```

数据压缩文件储存在本地的时候

```typescript
const dataCollect = DataCollect(imageClassDataCollect, {
    url: 'file:///home/dataset/data.zip'
});
```

