# Pipcook 框架

Pipcook 使用的脚本是没有 bundle 一些比较重的依赖的，比如 `@tensorflow/tfjs`，那么我们如何在脚本中使用他们呢？
事实上，Pipcook 会把这些依赖打包在所谓的`框架`中，实际上，框架是一组和平台、node.js 版本，相关的包，比如以下 pipeline：
```json
{
  "specVersion": "2.0",
  "type": "ObjectDetection",
  "datasource": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@2232184/scripts/object-detection-yolo/build/datasource.js?url=https://pc-github.oss-us-west-1.aliyuncs.com/dataset/object-detection-yolo-min.zip",
  "dataflow": [
    "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@2232184/scripts/object-detection-yolo/build/dataflow.js?size=416&size=416"
  ],
  "model": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@2232184/scripts/object-detection-yolo/build/model.js",
  "artifact": [{
    "processor": "pipcook-artifact-zip@0.0.2",
    "target": "./object-detection-yolo-model.zip"
  }],
  "options": {
    "framework": "tfjs@3.8",
    "train": {
      "epochs": 10,
      "gpu": true
    }
  }
}
```

这条 pipeline 使用了框架 `tfjs@3.8`，包含 `@tensorflow/tfjs-node@3.8`、`@tensorflow/tfjs-node-gpu@3.8`，需要注意的是，脚本不需要引用这两个包，而是引用 `@tensorflow/tfjs`，在框架加载时，会根据 `train.gpu` 选项确定是否需要将`@tensorflow/tfjs-node-gpu@3.8` 设置为 backend，由于 macOS 不支持 CUDA，因此框架也会抹平平台差异：`train.gpu` 在 macOS 系统上不会生效。这种能力是由框架中的初始化脚本实现的，这就涉及到框架的组织结构：每个框架中包含了一个框架描述文件，框架初始化脚本和若干依赖文件夹。以 `tfjs@3.8` 包为例，目录结构如下:

```sh
├── framework.json
├── index.js
└── node_modules
```

其中 `framework.json` 是框架的描述文件，`index.js` 是框架的初始化脚本，`node_modules` 内包含的则是框架所要提供的依赖文件夹。
`framework.json` 如下：

```json
{
  "name": "tfjs",
  "version": "3.8",
  "packages": [
    {
      "name": "@tensorflow/tfjs-node",
      "version": "3.8.0",
      "type": "js"
    },
    {
      "name": "@tensorflow/tfjs-node-gpu",
      "version": "3.8.0",
      "type": "js"
    }
  ]
}
```

初始化脚本导出一个初始化函数，将在每次 pipeline 运行到框架初始化阶段时被调用，传入 pipeline 的 `option` 字段，示例如下：

```js
const os = require('os');

module.exports = {
  initialize(opts) {
    if (
      opts && opts.train
      && (
        opts.train.gpu === 'true'
        || opts.train.gpu === true
      )
    ) {
      if (os.platform() !== 'darwin') {
        require('@tensorflow/tfjs-node-gpu');
        console.log('gpu enabled');
      } else {
        require('@tensorflow/tfjs-node');
        console.warn('platform darwin does not support gpu');
      }
    } else {
      require('@tensorflow/tfjs-node');
      console.log('gpu disabled');
    }
  }
}
```

另外，`tfjs` 的 backend 在不同平台都有不同的二进制库，所以 Pipcook 在会根据环境的不同选择下载不同的包，比如在 macOS，node.js v12.22 上，实际下载的框架文件为 `https://pipcook-cloud.oss-cn-hangzhou.aliyuncs.com/framework/node12-py37/tfjs%403.8-darwin-x64-v8.zip`，而在 linux，node.js v14.0 上，则会下载 `https://pipcook-cloud.oss-cn-hangzhou.aliyuncs.com/framework/node14-py37/tfjs%403.8-linux-x64-v6.zip`。当然，如果脚本依赖一些自定义的框架，也可以直接把完整的 url 填入 `framework` 选项来直接使用，或者通过自建一个框架镜像，然后通过 `trian`，`predict`，`serve` 命令的 `-m` 参数指定框架镜像地址。
一个完整的框架镜像目录结构如下：

```sh
├── node14-py37/{framework-name}@{version}-{os}-{arch}-{napi-version}.zip
└── node12-py37/{framework-name}@{version}-{os}-{arch}-{napi-version}.zip
```

链接中的 `py37` 是引用的 `BOA` 支持的 python 版本，目前只支持 v3.7。
