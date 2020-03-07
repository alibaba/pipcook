# @pipcook/pipcook-plugins-image-class-data-process

图片分类数据预处理插件，接受由 Access 插件流过来的图片数据，进行图片处理

<a name="klNlr"></a>
#### pipcook 插件类别：
Data Process

<a name="dHfzX"></a>
#### 参数

- normalization(boolean)[可选]: 归一化图片，默认为false
- rotationRange(number)[可选]: 随机旋转图片，此属性为旋转的范围，例如如果为15，则随机旋转 (-15， 15)度
- brightnessRange(number)[可选]: 随机变换图片亮度，此属性为变化的范围

<a name="vE6A8"></a>
#### 例子

```
const dataAccess = DataProcess(imageClassDataProcess, {
  normalization: true,
  rotationRange: 15
});
```
