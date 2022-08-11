# Pipcook Framework

Pipcook uses scripts that don't bundle some of the heavier dependencies like `@tensorflow/tfjs`, so how do we use them in our scripts?
In fact, Pipcook packages these dependencies in a so-called `framework`, which is actually a set of packages related to the platform and node.js version, such as the following pipeline:

```json
{
  "specVersion": "2.0",
  "type": "ObjectDetection",
  "datasource": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@9d210de/scripts/object-detection-yolo/build/datasource.js?url=https://pc-github.oss-us-west-1.aliyuncs.com/dataset/object-detection-yolo-min.zip",
  "dataflow": [
    "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@9d210de/scripts/object-detection-yolo/build/dataflow.js?size=416&size=416"
  ],
  "model": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@9d210de/scripts/object-detection-yolo/build/model.js",
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

This pipeline uses the framework `tfjs@3.8`, which contains `@tensorflow/tfjs-node@3.8`, `@tensorflow/tfjs-node-gpu@3.8`. Note that the script does not need to reference these two packages, but rather `@tensorflow/tfjs`. When the framework loads, it determines whether `@tensorflow/tfjs-node-gpu@3.8` needs to be set to backend based on the `train.gpu` option. Since macOS does not support CUDA, the framework also smoothes out platform differences: `train.gpu` will not take effect on macOS systems. This capability is implemented by initialization scripts in the framework, which involves the framework's structure: each framework contains a framework description file, a framework initialization script, and several dependency folders. As an example, the `tfjs@3.8` package has the following directory structure:


```sh
├── framework.json
├── index.js
└── node_modules
```

Where `framework.json` is the framework's description file, `index.js` is the framework's initialization script, and `node_modules` contains the dependency folder that the framework will provide.
Content of `framework.json` is as follows:

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

The initialization script exports an initialization function that will be called each time the pipeline runs to the framework initialization phase, passing in the `options` field of the pipeline file, as in the following example:

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

In addition, the backend of `tfjs` has different binary libraries for different platforms, so Pipcook will choose to download different packages depending on the environment, for example, on macOS, node.js v12.22, the actual framework file downloaded is `https://pipcook-cloud.oss-cn-hangzhou.aliyuncs.com/framework/node12-py37/tfjs%403.8-darwin-x64-v8.zip`, while on linux, node.js v14.0, it will download `https://pipcook-cloud.oss-cn-hangzhou.aliyuncs.com/framework/node14-py37/tfjs%403.8-linux-x64-v6.zip`. Of course, if the script dependes on a custom framework, you can also use it directly by filling in the `framework` option with the full url, or by creating your own framework mirror and specifying the framework mirror address with the `-m` argument of the `trian`, `predict`, `serve` commands.
A complete framework mirror directory structure is as follows:


Translated with www.DeepL.com/Translator (free version)
```sh
├── node14-py37/{framework-name}@{version}-{os}-{arch}-{napi-version}.zip
└── node12-py37/{framework-name}@{version}-{os}-{arch}-{napi-version}.zip
```

The `py37` in the path is the version of python supported by the referenced `BOA`, which currently only supports v3.7.
