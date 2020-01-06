接入目标检测数据，此插件期待 PASCOL VOC 格式的数据集进入，并将数据接入为 tf.data api的数据进入下游


<a name="c8ad2b59"></a>
#### pipcook 插件类别：

Data Access


<a name="3d0a2df9"></a>
#### 参数

- imgSize(number[]): 图片尺寸，将会统一把图片重置为特定尺寸，默认为[224, 224]，制定此属性需要注意，很多目标检测模型对尺寸有特别要求


<a name="8cb94eb1"></a>
#### 例子

```typescript
const dataAccess = DataAccess(imageDetectionDataAccess);
```
