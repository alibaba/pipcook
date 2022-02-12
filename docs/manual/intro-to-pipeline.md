# Introduction to Pipeline

In Pipcook, we use Pipeline to represent the training process of a model, so in general, what kind of pipeline is needed to train a model? The developer can use a JSON to describe pipeline of modeling from sample collection, model definition, training to model evaluation:

```js
{
  "specVersion": "2.0",
  "datasource": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@e5503a0/scripts/image-classification-mobilenet/build/datasource.js?url=http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/imageclass-test.zip",
  "dataflow": [
    "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@e5503a0/scripts/image-classification-mobilenet/build/dataflow.js?size=224&size=224"
  ],
  "model": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@e5503a0/scripts/image-classification-mobilenet/build/model.js",
  "artifact": [{
    "processor": "pipcook-artifact-zip@0.0.2",
    "target": "/tmp/mobilenet-model.zip"
  }],
  "options": {
    "framework": "tfjs@3.8",
    "train": {
      "epochs": 20,
      "validationRequired": true
    }
  }
}
```

As shown above, a Pipeline consists of three types of Script, `dataSource`, `dataflow` and `model`, as well as the build plugin `artifacts`, and the Pipeline options `options`.
Each Pipcook script passes parameters via a URI query, and the parameters of the model script can also be defined via `options.train`.
`artifacts` defines a set of build scripts, each of which will be called in turn after the training is completed, allowing the output model to be transformed, packaged, deployed, etc.
`options` contains the framework definition and the definition of training parameters.
Then, Pipcook prepares the environment, runs the Script, and finally outputs and processes the model based on the URIs and parameters defined in this JSON file.

> See [Introduction to Script](./intro-to-script.md) for more details about Pipcook script.

> The script of a pipeline supports `http`, `https` and `file` protocol.

Next, when we have defined such a pipeline, we can run it through Pipcook.

## Preparation

Follow the [Pipcook Tools Installation](./pipcook-tools.md) to get the Pipcook ready.

## Run Pipeline

Save the above JSON of your pipeline in the disk, and run:

```sh
$ pipcook run /path/to/your/pipeline-config.json
```

Or serve it on static source server:

```sh
$ pipcook run https://host/path/to/your/pipeline-config.json
```

After execution, the trained model files are generated in a folder named with the current timestamp under the current [working directory](https://linux.die.net/man/3/cwd), and the model files are compressed by the build plugin `pipcook-artifact-zip` into a zip file and saved in the tmp directory.

```
  ├── pipeline-config.json
  ├── cache
  ├── data
  ├── framework
  ├── model
  └── scripts
```

The directory named model holds the model files, and the ability to use the model will be added in the next release.
