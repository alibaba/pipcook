# @pipcook/pipcook-plugins-detection-detectron-data-access

我们官方内置了一条基于 facebook 的 python 目标检测框架 detectron2，此插件用于 detectron2 训练的链路中数据接入的部分，此插件将会把数据接入为 detectron2 接受的数据

<a name="klNlr"></a>
#### pipcook 插件类别：
Data Access

<a name="xzxwP"></a>
#### 参数: 
无

<a name="dp5l1"></a>
#### 例子：

```
let imageDetectronAccess = require('@pipcook/pipcook-plugins-detection-detectron-data-access').default;
const dataAccess = DataAccess(imageDetectronAccess);
```

