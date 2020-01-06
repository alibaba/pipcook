# @pipcook/pipcook-plugins-detection-detectron-model-load

我们官方内置了一条基于 facebook 的 python 目标检测框架 detectron2，此插件用于 detectron2 训练的链路中模型加载的部分，会加载基于 Faster RCNN 的目标检测模型

<a name="klNlr"></a>
#### pipcook 插件类别：
Model Load

<a name="xzxwP"></a>
#### 参数: 

- device (string) [可选]: 默认为 cpu， 如果要使用 gpu，请指定为 gpu
- modelId (string) [可选]: 默认为新模型，如果要使用之前 pipcook 训练过的模型，请指定 pipcook 模型 id
- modelName (string): 如果没有指定 modelId, 则请为新模型指定一个名字

例子：

```typescript
let detectronModelLoad = require('@pipcook/pipcook-plugins-detection-detectron-model-load').default;

const modelLoad = ModelLoad(detectronModelLoad, {
  modelName: 'test1'
});
```

