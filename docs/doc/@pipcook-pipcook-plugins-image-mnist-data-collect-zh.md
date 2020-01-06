此插件用于图片分类管道中将经典 mnist 手写数据集收集进来并以一定的数据集格式存储 (PASCOL VOC)

<a name="klNlr"></a>
#### pipcook 插件类别：
Data Collect

<a name="1ZMoY"></a>
#### 参数

- trainingCount(number)[可选]: 采集的用作训练集的数量，默认为8000张图片
- testCount(number)[可选]: 采集的用作测试集的数量，默认为500张图片

<a name="zZyd7"></a>
#### 例子
收集2000张图片作为训练集和500张图片作为测试集

```typescript
const dataCollect = DataCollect(imageMnistDataCollection, {
  trainingCount:2000,
  testCount: 500
});
```
