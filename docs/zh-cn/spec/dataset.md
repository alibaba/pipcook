# 数据集规范

## 背景

深度学习，数据是基础，后续的各种模型都是在数据集的基础上构建的，我们需要把数据集管理起来。以下为 Pipcook 在数据通过收集插件 (DataCollect) 之后应该保存的数据集规范格式，我们的数据接入层 (DataAccess) 会假设数据已经符合以下规范。对于不同数据集格式，将通过数据收集插件磨平差异。

## 数据集规范

### 目标检测/图片分类

PASCAL VOC 数据集格式，详细目录如下：

```
- 根目录 (名字应该为数据集名字， 例如 mnist)
  - annotations
    - train
      - ${image_name}.xml
      - ......
    - test
    - validation
  - images
    - ${image_name}.jpg
    - ......
```

对于 XML 描述文件，其格式为：

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<annotation>
  <folder>文件夹 path</folder>
  <filename>图片名字</filename>
  <size>
    <width>图片的宽</width>
    <height>图片的高</height>
  </size>
  <object>
    <name>分类名</name>
    <bndbox> // 此项对图片分类不需要，目标检测需要
      <xmin>目标左边坐标</xmin>
      <ymin>目标上边坐标</ymin>
      <xmax>目标右边坐标</xmax>
      <ymax>目标下面坐标</ymax>
    </bndbox>
  </object>
</annotation>
```

### 文本分类

文本分类应为 CSV 文件，第一列为文本内容，第二列为分类名，分隔符为 ',' 没有头部。
