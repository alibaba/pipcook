# @pipcook/pipcook-plugins-image-coco-data-collect

在很多时候，我们使用 coco data 的格式来存储目标检测的数据，我们的管道同样支持这种格式的输入，此插件将会收集 coco data 的目标检测数据，并将其转化为 PASCOL VOC 的格式存储。

<a name="klNlr"></a>
#### pipcook 插件类别：
Data Collect

<a name="xzxwP"></a>
#### 参数: 

- url (string): 数据的路径，可以为远程或者本地。使用本地路径，需要在路径前加上 file:// , 路径应该指向一个 zip 压缩文件，这个压缩文件包含一个 image 文件夹和一个 json 注解文件， image 文件夹里有所有图片，注解文件为 coco format 的注解，关于更多 coco format 的信息，可以参考[这里](https://www.immersivelimit.com/tutorials/create-coco-annotations-from-scratch)
- validationSplit (number)[可选]: 0-1, 有百分之多少将会被划分为验证集
- testSplit (numer) [可选]: 0-1, 有百分之多少会被划分为测试集
- annotationFileName(string)[可选]: 默认为 annotation.json, 您的压缩文件中注解文件的名字

<a name="2e1Vr"></a>
#### 例子:

```
const dataCollect = DataCollect(imageCocoDataCollect, {
    url: 'xxx',
    testSplit: 0.1,
    annotationFileName: 'annotation.json'
  });
```

