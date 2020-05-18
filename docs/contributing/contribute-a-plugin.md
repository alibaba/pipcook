# Contribute a Plugin

Pipcook welcomes developer to contribute plugins for us to extend the functions of Pipcook. This document describes how to develop a plugin. The content involved in this article is just a few suggestions, the specific plugin can run successfully in Pipcook as long as it meets our plugin prototype specifications.

## Plugin Specification

We strongly recommend that you first understand the plugin specifications that we define. Only plugins that meet the interface that we define can be accepted. For more information about the specification of each plugin, see [here](../contribution/contributor-guide.md) for plugin development specifications.

The plugin type could be:

- Data Collect
- Data Access
- Data Process
- Model Load
- Model Train
- Model Evaluate

## Create a Plugin

A plugin consists of the following parts:

- A JavaScript function.
- Type of function (inherited interface).
- Function parameters: include data, model, and custom parameters.
- Function return value: the return value of the plugin type.

The Pipcook's CLI provides a convenient way to initialize the plugin development workspace. You only need to run the following command:

```sh
$ pipcook plugin-dev -t <plugin type> [-n <plugin name, default: template-plugin>]
$ cd template-plugin
$ npm install
```

You can initialize a development environment, which contains the following structure:

```
- template-plugin
  - src
    - Index. ts // plugin code main entry
  - package. json // npm project configuration and dependency files
  - . npmignore // npm publish configuration file
  - tsconfig. json // typescript compilation configuration file
```

### Auto-injected parameters and user-defined parameters

If you check our [Plugin Specification](../spec/plugin.md), you will notice that the plugin we define mainly contains three parameters: data (not necessary), model (not necessary), and args. The data and model parameters are automatically injected by pipcook during pipeline execution. The args parameters are custom parameters that can be input by the plugin. After a plugin is developed and the user runs pipeline, the user does not need to display input data and model parameters to the corresponding component of the plugin. For example, the interface of a data access plugin is:

```js
interface DataAccessType extends PipcookPlugin {
  (data: OriginSampleData | OriginSampleData[], args?: ArgsType): Promise<UniformSampleData>
}
```

Therefore, any data access plugin contains two parameters, data and args. However, the user code should be similar to this:

```js
const dataAccess = DataAccess(imageClassDataAccess, {
  imgSize:[28, 28],
});
```

When you use the plugin, you do not directly call the plugin. Instead, you can pass the plugin into the corresponding component and the user parameters at the same time. The user parameters are the args parameters.

## Development

This chapter uses a simple example to show how to develop a data processing plugin

### Data Processing Plugin Interface

```js
export interface DataProcessType extends PipcookPlugin {
  (data: UniformSampleData | UniformSampleData[], args?: ArgsType): Promise<UniformSampleData>
}
```

First, you can view the interface of the plugin type you want to develop according to the preceding link. For example, the plugin of the data processing type accepts a parameter of the supposed sampledata type and an optional parameter of the ArgsType type as shown above. The following figure shows the sub-interface type of sampledata:

```js
interface UniformSampleData {
  trainData: tf.data.Dataset<{xs: tf.Tensor<any>, ys?: tf.Tensor<any>}>;
  validationData?: tf.data.Dataset<{xs: tf.Tensor<any>, ys?: tf.Tensor<any>}>;
  testData?: tf.data.Dataset<{xs: tf.Tensor<any>, ys?: tf.Tensor<any>}>;
  metaData: metaData;
  dataStatistics?: statistic[];
  validationResult?: {
    result: boolean;
    message: string;
  }
}
```

`ArgsType` is the custom parameter that the plugin expects to enter.

### Mocking Data

You can prepare the corresponding mock data based on the interface to develop the plugin. For example, if we develop a data processing plugin, we can construct the following mock data:

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

For example, if the data processing plugin needs to double the size of each feature, you can implement your plugin as follows:

```js
import { DataProcessType, UniformSampleData, ArgsType } from '@pipcook/pipcook-core';
const templateDataProcess: DataProcessType = async (data: UniformSampleData, args?: ArgsType): Promise<UniformSampleData> => {
  const { trainData } = data;
  return {
    ...data,
    trainData: trainData.map((v) => 2*v)
  };
};

export default templateDataProcess;
```

After developing your plugin, you need to check the following two points:

- Your plugin runs well without any errors
- The results returned by your plugin also comply with the results specifications.

After ensuring the preceding two points, you can run a real pipcook pipeline to check whether your plugin is compatible with the corresponding upstream and downstream plugins.

## Release

After you have developed the plugin, you can create your own GitHub repository, and push your code and corresponding unit tests to your own repository, the repository should be named "pipcook-plugins-{name}-{type}"

You can also submit a pull request to the master branch to submit your plugin documentation and corresponding instructions. The steps are as follows:

### Fork Project

![image.png](https://img.alicdn.com/tfs/TB1aaMbuKL2gK0jSZFmXXc7iXXa-2006-358.png)

### Clone to your local

![image.png](https://img.alicdn.com/tfs/TB1CWz7uGL7gK0jSZFBXXXZZpXa-718-368.png)

#### Create a Branch

```sh
$ git checkout -b pipcook-plugins-{name}-{type}
```

#### Write your documents

First, open the file [docs/spec/plugin.md](../spec/plugin.md), and update the following plugin list:

![image.png](https://img.alicdn.com/tfs/TB14EscuG61gK0jSZFlXXXDKFXa-988-476.png)

#### Submit To Your Forked Repository

```sh
$ git add .
$ git commit -m "plugin doc dev"
$ git push
```

#### Submit a Pull Request

![image.png](https://img.alicdn.com/tfs/TB1IP69uKT2gK0jSZFvXXXnFXXa-1318-172.png)

After passing our review, we will add your document to Pipcook's official document and merge your code into the master branch, and publish your plugin to the npm repository of Pipcook. You will also become one of the developers of Pipcook.
