# Contribute a Plugin

Pipcook welcomes developers to contribute plugins for us to extend the functions of Pipcook. This document describes how to develop a plugin. The content involved in this article is just a few suggestions, the specific plugin can run successfully in Pipcook as long as it meets our plugin prototype specifications.

We strongly recommend that you first understand the [plugin specification](../spec/plugin.md) that we define. Only plugins that meet the interface that we define can be accepted.

## Get Started

To get started with developing a new plugin, [Pipcook Tools][] provides `pipcook plugin-dev`:

```sh
$ pipcook plugin-dev --type <category> --name <plugin>
```

A plugin script is a TypeScript function that inherits from the corresponding plugin interface, for exmaple, a `DataCollectType` plugin will look like this:

```js
const collectTextline: DataCollectType = async (args: ArgsType): Promise<void> => {
  const { uri, dataDir } = args;
  await fs.copy(uri, dataDir + '/my-own-dataset.csv');
  return null;
};
```

For other plugin interfaces, see [this list of plugin categories](../spec/plugin.md#plugin-category).


## Test your plugin

You can prepare the corresponding mocking data based on the interface. For example, if you developed a `DataProcessType` plugin, create some mock firstly:

```js
const data = {
  trainData: tf.data.array([{xs: [1,2,3], ys: [1]},{xs: [4,5,6], ys: [2]}]),
  metaData: {
    feature: {
      name: 'train',
      type: 'int32',
      shape: [1,3]
    },
    label: {
      name: 'test,
      type: 'int32',
      shape: [1]
    },
  }
};
```

If the `DataProcessType` plugin needs to double the size of each feature, you can implement your plugin as follows:

```js
const doubleSize: DataProcessType = async (sample: Sample, metadata: Metadata, args?: ArgsType): Promise<void> => {
  // double the data
  sample.data = sample.data * 2;
};
export default doubleSize;
```

You need to check the following two before releasing that:

- a plugin is able to run without any errors.
- the returned value of your plugin comply with the [plugin specfication](../spec/plugin.md).

After ensuring the preceding the above, you can run a real pipeline to check whether your plugin is compatible with the corresponding upstream and downstream plugins.

## Release

Once you have developed the plugin done, you can create own plugin package on NPM:

```sh
$ npm publish
```

And anyone could try your plugin via the following command:

```sh
$ pipcook plugin install your-pipcook-plugin-name
```

## Database

If your modification involves `Database` structure, you need to write a migration script under `daemon/src/migrations`.
For more detail about it, please refer to [Migration](https://sequelize.org/master/manual/migrations.html).

## Awesome Pipcook Plugins

Below is the awesome list of Pipcook plugins, we welcome third-party plugin contributors to update this list via GitHub Pull Request.

### `dataCollect`

- @pipcook/plugins-csv-data-collect
- @pipcook/plugins-image-classification-data-collect
- @pipcook/plugins-mnist-data-collect
- @pipcook/plugins-object-detection-coco-data-collect
- @pipcook/plugins-object-detection-pascalvoc-data-collect

### `dataAccess`

- @pipcook/plugins-coco-data-access
- @pipcook/plugins-csv-data-access
- @pipcook/plugins-pascalvoc-data-access

### `dataProcess`

- @pipcook/plugins-image-data-process

### `modelDefine`

- @pipcook/plugins-bayesian-model-define
- @pipcook/plugins-detectron-fasterrcnn-model-define
- @pipcook/plugins-tfjs-mobilenet-model-define
- @pipcook/plugins-tfjs-simplecnn-model-define

### `modelTrain`

- @pipcook/plugins-bayesian-model-train
- @pipcook/plugins-image-classification-tfjs-model-train
- @pipcook/plugins-detectron-model-train

### `modelEvaluate`

- @pipcook/plugins-image-data-process
- @pipcook/plugins-bayesian-model-evaluate
- @pipcook/plugins-image-classification-tfjs-model-evaluate
- @pipcook/plugins-detectron-model-evaluate

[Pipcook Tools]: ../../manual/pipcook-tools.md
