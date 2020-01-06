# @pipcook/pipcook-plugins-detection-detectron-model-deploy

此插件用于将 detectron2 目标检测模型部署到本地，启动一个本地的 server， 并且返回相应的预测结果

<a name="Ej4GX"></a>
#### pipcook 插件类别
Model Deploy

<a name="vGyBc"></a>
#### 参数

- 无

<a name="ZZcV2"></a>
#### 例子：

```typescript
const detectronModelEvaluate = require('@pipcook/pipcook-plugins-detection-detectron-model-evaluate').default;
const modelEvaluate = ModelEvaluate(detectronModelEvaluate);

```

<a name="9NElt"></a>
#### 注意
对于我们的本地部署链路，以下是我们的请求格式 (以 curl 为例），data 里的数据是所需要预测的图片 url 的数组
```typescript
curl -X POST \
  http://127.0.0.1:7778/predict \
  -H 'Content-Type: application/json' \
  -H 'Host: 127.0.0.1:7778' \
  -d '{
    "data": ["https://img.alicdn.com/tfs/TB1RFVfrRv0gK0jSZKbXXbK2FXa-60-60.jpg"]
  }'
```

输出

```typescript
{
    "status": true,
    "result": [
        "<prediction result>"
    ]
}
```

