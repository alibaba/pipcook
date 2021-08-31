# Pipelines

## Text Classification

### Dataset

文本分类 Pipeline 的数据集组织格式如下：

```sh
.
├── test
│   └── textDataBinding.csv
└── train
    └── textDataBinding.csv
```

`train` 文件夹内是训练数据，`test` 文件夹内是测试数据，存储为 csv 格式。csv 文件内有两列数据，分别为 input 和 output，input 为样本数据，output 为样本标签，如：

| input                                                        | output    |
| ------------------------------------------------------------ | --------- |
| 原创春秋新款宽松黑色牛仔裤男贴布哈伦裤日系潮流胖男大码长裤子 | itemTitle |
| 茗缘翡翠                                                     | shopName  |
| 挂画精美 种类丰富                                            | itemDesc  |

这3个样本表示了3类不同的文本，他们的标签分别是`itemTitle`，`shopName`，`itemDesc`。需要注意的是，数据集中的数据需要尽可能多，且分布相对均匀，也就是说每个类别的样本数量应该差不多，差异过大将影响模型的准确度。

如果在本地训练，可以将数据源改为本地文件夹路径:

```json
{
  "datasource": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@5ec4cdf/scripts/text-classification-bayes/build/datasource.js?url=file:///path/to/dataset-directory"
}
```

`/path/to/dataset-directory` 内包含 `test` 和 `train` 文件夹。

如果是跨机训练，可以将 `test` 和 `train` 目录压缩成 zip 文件，存储在 OSS 上，修改数据源为 zip 文件地址:

```json
{
  "datasource": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@5ec4cdf/scripts/text-classification-bayes/build/datasource.js?url=http:///oss-host/my-dataset.zip"
}
```

## 参数

