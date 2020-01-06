# 想要使用python？

pipcook 的宗旨是服务于前端工程师，推动前端智能化发展，所以 pipcook 采用 JavaScript （TypeScript) 开发，给予开发者基于 JS 的 API 并且在全部的 pipeline 在 JS 的环境中运行。然而，现阶段在数学，数据分析，数据处理和机器学习领域，python 语言的类库更多，生态更加繁荣。因此，我们开发了 pipcook-python-node， 希望将整个 python的生态引入 pipcook， 并且以 JS 的方式调用 python 的类库，从而扩展 JS 的能力

<a name="VLC91"></a>
### 运行环境

---

python >= 3.6, 查看 python 版本， 可以运行查看

```typescript
python --version
```

pip 指向正确的 python 版本， 可以运行查看

```typescript
pip --version
```

实际上当您使用 pipcook-python-node 的 api时，我们会自动在当前工作目录创建虚拟环境，但是为了保证环境配置正确，您也可以手动实现创建 python 虚拟环境，您可以在当前工作目录运行如下命令

```typescript
pip install virtualenv
virtualenv --no-site-packages pipcook_venv
```

**我们强烈建议您使用我们的 docker 镜像去运行 pipcook，这样您不再需要执行上述命令，也不需要担心环境的问题, 可以参考**[**这里**](https://alibaba.github.io/pipcook/doc/快速入门-zh)**有详细的 docker 的信息**
```typescript
docker pull pipcook/pipcook
```

<a name="XZqjF"></a>
### 一个例子

---

在这里让我们用一个实例向您展示您可以如何使用 pipcook-python-node 去利用 python 的生态。此例子是关于一个深度学习的训练，展示了我们如何在 js 里使用 Keras (一个著名的基于 tensorflow 的 python 高阶深度学习框架)进行深度卷积网络的训练，为了更好的说明，我们将比较使用 python 和 js 做到相同的事情

<a name="4MzuV"></a>
#### python
```python
import numpy as np
import keras
from keras.models import Sequential
from keras.layers import Dense, Dropout, Flatten
from keras.layers import Conv2D, MaxPooling2D
from keras.optimizers import SGD

# Generate dummy data
x_train = np.random.random((100, 100, 100, 3))
y_train = keras.utils.to_categorical(np.random.randint(10, size=(100, 1)), num_classes=10)

model = Sequential()
model.add(Conv2D(32, (3, 3), activation='relu', input_shape=(100, 100, 3)))

model.add(Flatten())
model.add(Dense(256, activation='relu'))
model.add(Dense(10, activation='softmax'))

sgd = SGD(lr=0.01, decay=1e-6, momentum=0.9, nesterov=True)
model.compile(loss='categorical_crossentropy', optimizer=sgd)

model.fit(x_train, y_train, batch_size=32, epochs=10)
```

<a name="to2iW"></a>
#### pipcook-python-node (JS)

```python
Python.scope('test1', (python) => {
    const _ = python.nA;
    python.install('numpy');
    python.install('keras');
    python.install('tensorflow');
    const np = python.import('numpy');
    const keras = python.import('keras');
    const [Sequential] = python.fromImport('keras.models', ['Sequential']);
    const [Dense, Dropout, Flatten] = python.fromImport('keras.layers', ['Dense', 'Dropout', 'Flatten']);
    const [Conv2D, MaxPooling2D] = python.fromImport('keras.layers', ['Conv2D', 'MaxPooling2D']);
    const [SGD] = python.fromImport('keras.optimizers', ['SGD']);

    const x_train = np.random.random([100, 100, 100, 3]);
    const y_train = keras.utils.to_categorical(np.random.randint(10, _({size: [100, 1]})), _({num_classes: 10}));

    const model = Sequential();

    model.add(Conv2D(32, [3, 3], _({activation: 'relu', input_shape: [100, 100, 3]})));

    model.add(Flatten());
    model.add(Dense(256, _({activation: 'relu'})));
    model.add(Dense(10, _({activation: 'softmax'})));

    const sgd = SGD(_({
      lr: 0.01,
      decay: 1e-6,
      momentum: 0.9,
      nesterov: true
    }));

    model.compile(_({
      loss: 'categorical_crossentropy',
      optimizer:sgd
    }));

    model.fit(x_train, y_train, _({batch_size: 32, epochs: 1}));
  });
```

通过上述两段代码比较可以看出，我们尽量让 pipcook-python-node 大部分 API 的使用方式尽可能地像 python，由于两者语言的差异，上述两段代码大约有如下几点不同：

- 由于 python 支持函数的命名参数而 JS 是不支持的，所以我们使用 python.nA 来代替这种方式，nA 是 named argument 的意思。如上述代码，我们把 python.nA 赋给_, 这样我们可以使用 model.add(Dense(256, _({activation: 'relu'}))) 来代替 model.add(Dense(256, activation='relu'))
- pipcook 将使用工作空间的 pipcook_venv 的 python 虚拟环境，如果检测到当前工作空间没有此虚拟环境，我们将创建一个，您可以使用我们的 API: python.install 安装 python 库，也可以手动进入此虚拟环境安装，想要了解更多关于 python 虚拟环境的信息，可以参考[这里](https://virtualenv.pypa.io/en/latest/)
- 我们提供了 API: python.import 来代替原生的 import 关键字
- 我们后续会介绍更多的 pipcook-python-node 的 API


<a name="4ycEM"></a>
### API 介绍

---

<a name="rphvI"></a>
#### Python.scope(scopeName: string, callback: Function)

- scopeName: scope 是用来标识一个 python 的工作空间的，每一个 scope 有其独立的执行环境，在 pipcook-python-node 中可以同时定义多个工作空间，对应多个 ipython 的内核
- callback: 此回调函数会为用户传递一个 Python 类的实例，此实例绑定了一个工作空间，可以执行对应的操作和 python 代码
- Return: Promise<void>

此函数为 Python 类的静态方法，为用户返回一个 python 实例，之后可以利用 python 实例的各项方法执行 python 命令

<a name="dKiIR"></a>
#### python.import(packageName: string)

- packageName: python 库的名称
- Return: PythonObject

此方法用于引入 python包，相当于 python 中的 import xxx, 方法返回一个我们在 js 中抽象和定义的 python 对象

<a name="Me6O1"></a>
#### python.fromImport(packageName: stirng, importNames: string[])

- packageName: python 库的名称
- importNames：需要加载进来的名称
- Return: PythonObject[]

类似于 from ... import ..., 将按照 importName 数组的顺序返回 PythonObject 的名称

<a name="1Bkhj"></a>
#### python.install(packageName: string, version?: string)

- packageName: python 库的名称
- version：版本
- Return: void

此方法用于安装 python 包，相当于执行 pip install xxx, 版本不指定的话将安装最新稳定版本，如果需要使用更为复杂的 pip install, 可以参考 python.runshell 命令

<a name="fbkhh"></a>
#### python.runshell(command: string)

- command: 想要执行的 shell 命令
- Return: void

此方法用于在 shell 中执行命令，可以是任何当前系统支持的命令

<a name="NWo62"></a>
#### python.createNumber(number: number)

- number: 数字
- Return: PythonObject

创建一个代表 python 中基本类型-数字的 PythonObject 对象，实际上对于基本类型，如果后续直接把 js的基本类型传入函数也是可以的，因为我们会做自动的一些隐形转化，但是我们建议您使用 PythonObject 来避免一些意想不到的情况发生

<a name="uNBD7"></a>
#### python.createString(string: string, isRaw?: boolean)

- string: 字符串
- isRaw: 是否要使用原始字符串，相当于 python 中的 r'.....'
- Return: PythonObject

创建一个代表 python 中的基本类型 - 字符串的 PythonObject 对象

<a name="vBlRD"></a>
#### python.createBoolean(value: boolean)

- value: true or false
- Return: PythonObject

创建一个代表 python 中的基本类型 - 布尔值的 PythonObject 对象

<a name="40oz6"></a>
#### python.createNone()

- Return: PythonObject

创建一个代表 python 中的基本类型 - None 的 PythonObject 对象

<a name="1D4lI"></a>
#### python.createTuple(value: PythonObject[])

- value: 一个基本类型数组或者 PyhtonObject 数组
- Return PythonObject

创建一个 python 中的基本类型 - 元组 的 PythonObject 对象

<a name="nDXiR"></a>
#### python.createList(value: PythonObject[])

- value: 一个基本类型数组或者 PyhtonObject 数组
- Return PythonObject

创建一个 python 中的基本类型 - 列表 的 PythonObject 对象

<a name="3hWu1"></a>
#### python.createDictionary(value: object)

- value: 对象
- Return PythonObject

目前仅支持 key， value 为 PythonObject 或者 基本类型的字典

<a name="AR57J"></a>
#### python.equal(object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject
- Return: PythonObject

此方法比较两个 python 对象，相当于 python 比较操作符 ==

<a name="MN04J"></a>
#### python.notEqual(object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject
- Return: PythonObject

此方法比较两个 python 对象，相当于 python 比较操作符 !=

<a name="DaJ0A"></a>
#### python.larger(object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject
- Return: PythonObject

此方法比较两个 python 对象，相当于 python 比较操作符 a > b

<a name="7KQTq"></a>
#### python.smaller(object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject
- Return: PythonObject

此方法比较两个 python 对象，相当于 python 比较操作符 a < b

<a name="nJ4jP"></a>
#### python.largerEqual(object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject
- Return: PythonObject

此方法比较两个 python 对象，相当于 python 比较操作符 a >= b

<a name="eUYQs"></a>
#### python.smallerEqual(object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject
- Return: PythonObject

此方法比较两个 python 对象，相当于 python 比较操作符 a <= b

<a name="mAQeR"></a>
#### python.largerEqual(object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject
- Return: PythonObject

此方法比较两个 python 对象，相当于 python 比较操作符 a >= b

<a name="gDaY4"></a>
#### python.and(object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject
- Return: PythonObject

此方法比较两个 python 对象，相当于 python 逻辑操作符 a and b

<a name="6esBy"></a>
#### python.or(object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject
- Return: PythonObject

此方法比较两个 python 对象，相当于 python 逻辑操作符 a or b

<a name="m81wJ"></a>
#### python.not(object: PythonObject)

- object1: PythonObject
- object2: PythonObject
- Return: PythonObject

此方法比较两个 python 对象，相当于 python 逻辑操作符 not

<a name="HqkYC"></a>
#### python.if(condition: PythonObject, execution: Function)

- condition: if 语句的条件
- execution: if 语句的内容

此方法相当于条件操作，在使用 pipcook-python-node 时，请使用我们提供的 if 方法代替 js 原生的 if

<a name="p3SHy"></a>
#### python.add(object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject

此方法操作两个 python 对象，相当于 python 中的 a + b

<a name="ONgW5"></a>
#### python.minus(object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject

此方法操作两个 python 对象，相当于 python 中的 a - b


<a name="fFzYM"></a>
#### python.multiply(object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject

此方法操作两个 python 对象，相当于 python 中的 a * b

<a name="2VYtx"></a>
#### python.divide(object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject

此方法操作两个 python 对象，相当于 python 中的 a / b

<a name="DIYwS"></a>
#### python.add(object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject

此方法操作两个 python 对象，相当于 python 中的 a + b

<a name="aQ6UR"></a>
#### python.mod(object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject

此方法操作两个 python 对象，相当于 python 中的 a % b

<a name="kpCJd"></a>
#### python.pow(object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject

此方法操作两个 python 对象，相当于 python 中的 a ** b

<a name="mLRwI"></a>
#### python.floorDivide(object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject

此方法操作两个 python 对象，相当于 python 中的 a // b

<a name="SZzAK"></a>
#### python.runRaw(raw: string)

- raw： 需要执行的 python 语句
- Return：PythonObject

此方法用来执行原生的 python 语句，此方法不推荐使用，如果您确定现阶段我们提供的 API 无法满足您的要求，可以使用此方法，主要要使用 Python.convert(PythonObject) 转义， 例如：

```typescript
const number1 = python.createNumber(2)
const number2 = python.createNumber(3)
const result = pyhton.runRaw(`${Python.convert(number1)} + ${Python.convert(number2)}`);
```

<a name="K78rO"></a>
#### python.evaluate(object: PythonObject)

- object: PythonObject
- Return: {

type: string;<br />value: string;<br />}<br />此方法用来讲当前 PythonObject 代表的 python 对象的值返回回来，返回值包括 python 对象类型和python对象的值，都为字符串类型。后续我们会支持自定义转化器，可以根据类型和值转化为 js 对象

<a name="AbM0J"></a>
#### python.createNumpyFromTf(tensor: tf.Tensor)

- tensor: tf.Tensor: 一个 tfjs 的 tensor
- Return: PythonObject

将 js 中 tfjs 的 tensor 转化为 python 的 numpy 对象

<a name="bTnT4"></a>
#### python.reconnect()
刷新 ipython kernel， 在有些情况下，如果执行了一些安装语句，可能需要重链 kernel，才能生效
