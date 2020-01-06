# @pipcook/pipcook-plugins-text-class-local-model-deploy

此插件用于将文本分类模型部署到本地，启动一个本地的 server， 并且返回相应的预测结果

<a name="Ej4GX"></a>
#### pipcook 插件类别
Model Deploy

<a name="vGyBc"></a>
#### 参数

- 无

<a name="ZZcV2"></a>
#### 例子：

```typescript
const textClassLocalModelDeploy = require('@pipcook/pipcook-plugins-text-class-local-model-deploy').default;
const modelDeploy = ModelDeploy(textClassLocalModelDeploy);
```

<a name="9NElt"></a>
#### 注意
对于我们的本地部署链路，以下是我们的请求格式 (以 curl 为例），data 里的数据是所需要预测的文本的数组

```typescript
curl -X POST \
  http://127.0.0.1:7778/predict \
  -H 'Content-Type: application/json' \
  -H 'Host: 127.0.0.1:7778' \
  -d '{
    "data": ["this is an apple"]
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

