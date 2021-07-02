# 为 Pipcook 贡献脚本

Pipcook 乐于开发者为我们贡献脚本以扩展 Pipcook 的功能。 本文将介绍如何开发脚本。 其中涉及的内容仅为建议，只要符合我们的脚本原型规范就可以在 Pipcook 中成功运行。

> 强烈建议您先了解我们定义的[脚本规范](../spec/script.md)。

## 新手入门

插件开发从一行命令开始：`pipcook plugin create`：

```sh
$ pipcook plugin create --category <name> foobar
```

一个插件就是一个继承自 Pipcook 插件接口的 TypeScript 函数，比如一个 `DataCollectType` 插件：

```js
const collectTextline: DataCollectType = async (args: ArgsType): Promise<void> => {
  const { uri, dataDir } = args;
  await fs.copy(uri, dataDir + '/my-own-dataset.csv');
  return null;
};
```

其他插件的接口可以参考[该插件分类列表](../spec/plugin.md#plugin-category)。

## 插件开发

接下来，我们要写一个插件，它会把每一行数据的值乘以2：

```js
const doubleSize: DataProcessType = async (sample: Sample, metadata: Metadata, args?: ArgsType): Promise<void> => {
  // double the data
  sample.data = sample.data * 2;
};
export default doubleSize;
```

插件完成后，需要确保以下：

- 运行过程中不能崩溃；
- 函数返回值需要遵循[插件规范](../spec/plugin.md)；

上述要点验证后，就可以将你的插件插入到对应的 Pipeline 中去运行了。

### Python 开发环境

为了让一些非 Node.js 开发者（比如算法工程师）也能为 Pipcook 贡献插件，我们提供了完全基于 Python 的插件开发环境，脚本如下：

```py
# __init__.py
def main(sample, metadata, args):
  sample.data *= 2
```

Pipcook 约定 `main` 函数作为了插件的入口，参数与 Node.js 插件的参数保持一致，文件也需要命名为 `__init__.py`，除此之外，需要在 package.json 中增加：

```json
{
  "pipcook": {
    "runtime": "python"
  }
}
```

这样，当 Pipcook 在加载插件时，就会使用 Python 加载器来加载插件了，如需使用 Python 的第三方库，同样在 `conda.dependencies` 下申明即可如：

```json
{
  "pipcook": {
    "runtime": "python"
  },
  "conda": {
    "dependencies": {
      "tensorflow": "*",
      "numpy": "*"
    }
  }
}
```

也可以通过命令行快速初始化一个 Python 插件：

```sh
$ pipcook plugin create foobar --python
```

## 发布

插件开发和验证完成，就可以分享到 NPM 了：

```sh
$ npm publish
```

任何人都可以通过以下命令来安装使用：

```sh
$ pipcook plugin install your-pipcook-plugin-name
```
