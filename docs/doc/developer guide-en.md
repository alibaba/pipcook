<a name="c30f113c"></a>
### Repository

All our code will be open-source and hosted in our [github repository](https://github.com/alibaba/pipcook)


<a name="8a887b45"></a>
### Environment

- Operating system: MacOs, Linux
- Running environment: Node. js> = 10.16, Npm> = 6.1.0
- Python requirements (python> = 3.6, pip points to the correct python3 path)
- Global npm package: lerna, typescript compiler

To check whether the above environment is installed correctly, run the following command to check

```
node -v
npm -v
tsc -v
lerna -v
python --version
pip --version
```


<a name="b7ab3ef6"></a>
### Plugin development specifications

We have defined a set of interfaces for each plug-in. Each type of plugin must be implemented strictly according to the interfaces. The detailed information is as follows:

- [Data Collect](https://alibaba.github.io/pipcook/doc/DataCollect  Plugin-en)
- [Data Access](https://alibaba.github.io/pipcook/doc/DataAccess Plugin-en)
- [Data Process](https://alibaba.github.io/pipcook/doc/DataProcess Plugin-en)
- [Model Load](https://alibaba.github.io/pipcook/doc/ModelLoad Plugin-en)
- [Model Train](https://alibaba.github.io/pipcook/doc/ModelTrain Plugin-en)
- [Model Evaluate](https://alibaba.github.io/pipcook/doc/ModelEvaluate Plugin-en)
- [Model Deploy](https://alibaba.github.io/pipcook/doc/ModelDeploy Plugin-en)

<a name="078c8c94"></a>
### How to develop and debug a plug-in

You can refer [here](https://alibaba.github.io/pipcook/doc/How to develop a plugin?-en) View how to develop and debug a plug-in


<a name="e71b4e54"></a>
### Dataset specification

For data reading and processing involved in development, please refer to our [Dataset specification](https://alibaba.github.io/pipcook/doc/Dataset-en)


<a name="f31ccad5"></a>
### Contribution guide

Please refer [Here](https://alibaba.github.io/pipcook/doc/How to Contribute-en) View github code Submission Guide
