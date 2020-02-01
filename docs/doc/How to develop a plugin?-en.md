# How to develop a plugin?

Pipcook welcomes developers to contribute plug-ins for us to extend the functions of pipcook. This document describes how to develop a plug-in. The content involved in this article is just a few suggestions, the specific plug-in can run successfully in pipcook as long as it meets our plug-in prototype specifications.


<a name="ff93a5f0"></a>
### Plug-in specifications

---

First, we strongly recommend that you first understand the plug-in specifications that we define. Only plug-ins that meet the interface that we define can be accepted. For more information about the specification of each plug-in, see [Here](https://www.yuque.com/znzce0/in8hih/developguide) for Plug-in development specifications

The plug-in type can be:

- dataCollect
- dataAccess
- dataProcess
- modelLoad
- modelTrain
- modelEvaluate
- modelDeploy

<a name="bf4fba37"></a>
### Create a plug-in

---

A plug-in consists of the following parts:

- A JavaScript function.
- Type of function (inherited interface)
- Function parameters: include data, model, and custom parameters.
- Function return value: the return value of the plug-in type.

The pipcook-cli tool provides a convenient way to initialize the plugin development workspace. You only need to run the following command:

```
pipcook plugin-dev -t <plugin type>
cd template-plugin
npm install
```


You can initialize a development environment, which contains the following structure

- template-plugin
  - src
    - Index. ts // plug-in code main entry
  - package. json // npm project configuration and dependency files
  - . npmignore // npm publish configuration file
  - tsconfig. json // typescript compilation configuration file


<br />

<a name="5AOjl"></a>
### Auto-injected parameters and user-defined parameters

---

If you check our [Plug-in prototype specification](https://www.yuque.com/znzce0/in8hih/developguide) , you will notice that the plug-in we define mainly contains three parameters: data (not necessary), model (not necessary), and args. The data and model parameters are automatically injected by pipcook during pipeline execution. The args parameters are custom parameters that can be input by the plug-in. After a plug-in is developed and the user runs pipeline, the user does not need to display input data and model parameters to the corresponding component of the plug-in. For example, the interface of a data access plug-in is:

```
interface DataAccessType extends PipcookPlugin {
  (data: OriginSampleData | OriginSampleData[], args?: ArgsType): Promise<UniformSampleData>
}
```

Therefore, any data access plug-in contains two parameters, data and args. However, the user code should be similar to this:

```
const dataAccess = DataAccess(imageClassDataAccess, {
  imgSize:[28, 28],
});
```

When you use the plug-in, you do not directly call the plug-in. Instead, you can pass the plug-in into the corresponding component and the user parameters at the same time. The user parameters are the args parameters.

<a name="doESO"></a>
### Write a plug-in

---

This chapter uses a simple example to show how to develop a data processing plug-in
<a name="fdRb0"></a>
#### Data processing plug-in interface

```
export interface DataProcessType extends PipcookPlugin {
  (data: UniformSampleData | UniformSampleData[], args?: ArgsType): Promise<UniformSampleData>
}
```

First, you can view the interface of the plug-in type you want to develop according to the preceding link. For example, the plug-in of the data processing type accepts a parameter of the supposed sampledata type and an optional parameter of the ArgsType type as shown above. The following figure shows the sub-interface type of sampledata:

```
interface UniformSampleData{
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

ArgsType is the custom parameter that the plug-in expects to enter.

<a name="unEcd"></a>
#### Prepare mock data
You can prepare the corresponding mock data based on the interface to develop the plug-in. For example, if we develop a data processing plug-in, we can construct the following mock data

```
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
}
```

For example, if the data processing plug-in needs to double the size of each feature, you can implement your plug-in as follows:

```
import {DataProcessType, UniformSampleData, ArgsType} from '@pipcook/pipcook-core'

const templateDataProcess: DataProcessType = async (data: UniformSampleData, args?: ArgsType): Promise<UniformSampleData> => {
  const {trainData} = data;
  return {
  	...data,
    trainData: trainData.map((v) => 2*v)
  }
}

export default templateDataProcess;
```

After developing your plug-in, you need to check the following two points:

- Your plug-in runs well without any errors
- The results returned by your plug-in also comply with the results specifications.

After ensuring the preceding two points, you can run a real pipcook pipeline to check whether your plug-in is compatible with the corresponding upstream and downstream plug-ins.

<a name="CQJZ0"></a>
### Release Process

---

After you have developed the plugin, you can create your own github repository, and push your code and corresponding unit tests to your own repository, the repository should be named 'pipcook-plugins-xxx-(plugin type)'

You can also submit a pull request to the master branch to submit your plug-in documentation and corresponding instructions. The steps are as follows:

<a name="C8oUt"></a>
#### Fork Project
![image.png](https://img.alicdn.com/tfs/TB1aaMbuKL2gK0jSZFmXXc7iXXa-2006-358.png)

<a name="0prlf"></a>
#### Clone to your local
![image.png](https://img.alicdn.com/tfs/TB1CWz7uGL7gK0jSZFBXXXZZpXa-718-368.png)

<a name="qadiP"></a>
#### Create a branch based on your plugin

```
git checkout -b pipcook-plugins-xxx-<plugin type>
```

<a name="rSehE"></a>
#### Write your documents
First, edit the file pipcook/docs/doc/plug-in Introduction-zh. md and pipcook/docs/doc/Introduction of pipcook plugin-en.md, and update the following plug-in list

![image.png](https://img.alicdn.com/tfs/TB14EscuG61gK0jSZFlXXXDKFXa-988-476.png)

Then, create two new documents in pipcook/docs/doc, which are the Chinese and English versions of plugin documents. In the preceding list, create a hyperlink pointing to your new document. The document should contain how to install the plugin and the link to your own repository.

<a name="slBaM"></a>
#### Submit to your forked repository

```
git add . && git commit -m "plugin doc dev" && git push
```

<a name="v8XsX"></a>
#### Submit a Pull Request

![image.png](https://img.alicdn.com/tfs/TB1IP69uKT2gK0jSZFvXXXnFXXa-1318-172.png)


After passing our review, we will add your document to pipcook's official document and merge your code into the master branch, and publish your plug-in to the npm repository of pipcook. You will also become one of the developers of pipcook.
