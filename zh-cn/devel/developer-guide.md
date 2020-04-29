# 开发者手册

## 代码仓库

我们全部的代码将会开源并托管在我们的 GitHub 仓库中，这里是我们仓库的[地址](https://github.com/alibaba/pipcook)

## 环境搭建

- 操作系统：支持 macOs/Linux
- Node.js >= 12

## 开发

### 初始化

从 GitHub 克隆仓库：

```bash
$ git clone git@github.com:alibaba/pipcook.git
```

### 构建

通过下面的命令安装依赖，以及执行构建：

```bash
$ npm install
$ npm run build
```

### 测试

通过下面的命令来测试：

```bash
$ npm test
```

也可以只测试单个包：

```bash
$ ./node_modules/.bin/lerna run --scope <package_name>
```

### Pipeline

```bash
$ sh run_pipeline.sh <pipeline_name>
```

The `pipeline_name` 是目录 "test/pipelines" 下 Pipeline 的文件名称，如：

- "text-bayes-classification"
- "mnist-image-classification"
- "databinding-image-classification"

## 插件开发规范

可以点击[这里](../spec/plugin.md)查看插件规范文档。

我们为每个插件定义了一套接口，每个类型的插件需要严格按照接口实现，详细信息如下：

- [Data Collect](../spec/plugin/0-data-collect.md)
- [Data Access](../spec/plugin/1-data-access.md)
- [Data Process](../spec/plugin/2-data-process.md)
- [Model Load](../spec/plugin/3-model-define.md)
- [Model Train](../spec/plugin/4-model-train.md)
- [Model Evaluate](../spec/plugin/5-model-evaluate.md)

## 数据集规范

开发时涉及到数据读取处理请参考我们的[数据集规范](../spec/dataset.md)。
