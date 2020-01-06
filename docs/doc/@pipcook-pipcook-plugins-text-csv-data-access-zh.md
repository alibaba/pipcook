文本分类数据统一接入，该插件接受 csv 格式的数据，并统一成 tf.data 数据传入下游

<a name="klNlr"></a>
#### pipcook 插件类别：
Data Access

<a name="giDyb"></a>
#### 参数

- hasHeader(boolean): csv 是否有 header, 默认为false
- delimiter(string): csv的分隔符，默认为 ','

<a name="4WAOj"></a>
#### 例子 

```typescript
const dataAccess = DataAccess(textClassDataAccess);
```

