此插件用于将图片分类模型部署到本地，启动一个本地的 server， 并且返回相应的预测结果

<a name="Ej4GX"></a>
#### pipcook 插件类别
Model Deploy

<a name="vGyBc"></a>
#### 参数

- 无

例子：

```typescript
const imageClassLocalModelDeploy = require('@pipcook/pipcook-plugins-image-class-local-model-deploy').default;

// deploy into local
const modelDeploy = ModelDeploy(imageClassLocalModelDeploy);
```



注意<br />对于我们的本地部署链路，以下是我们的请求格式 (以 curl 为例），data 里的数据是所需要预测的图片 url 的数组

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

