# @pipcook/pipcook-plugins-image-class-data-access

接入图片分类数据，此插件期待 PASCOL VOC 格式的数据集进入，并将数据接入为 tf.data api的数据进入下游

<a name="klNlr"></a>
#### pipcook 插件类别：
Data Access

<a name="YN9Jh"></a>
#### 参数

- imgSize(number[]): 图片尺寸，将会统一把图片重置为特定尺寸，默认为[128, 128]

<a name="FZx0K"></a>
#### 例子
统一将上游进来的数据集统一为28*28的尺寸

```
const dataAccess = DataAccess(imageClassDataAccess, {
  imgSize:[28, 28],
});
```
