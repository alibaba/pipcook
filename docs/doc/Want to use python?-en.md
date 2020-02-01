# Want to use python?

The purpose of pipcook is to serve front-end engineers and promote the development of front-end intelligence. Therefore, pipcook is developed using JavaScript (TypeScript), giving developers JS-based APIs and running in all pipelines in the JS environment. However, at the current stage in the fields of mathematics, data analysis, data processing, and machine learning, the ecology of python is more prosperous. Therefore, we developed pipcook-python-node, hoping to introduce the entire python ecology into pipcook, and call the python class library in JS way, thereby expanding the capabilities of JS.

<a name="VLC91"></a>
### Runtime

---

python >= 3.6, you can run the command below to get python version

```
python --version
```

to get pip version

```
pip --version
```

In fact, when you use the pipcook-python-node api, we will automatically create a virtual environment in the current working directory, but in order to ensure the environment configuration is correct, you can also manually create a python virtual environment, you can run the following command in the current working directory

```
pip install virtualenv
virtualenv --no-site-packages pipcook_venv
```

**We strongly recommend that you use our docker image to run pipcook, so that you no longer need to execute the above commands, and you don't need to worry about the environment, you can refer to the detailed docker information **[**here**](https://alibaba.github.io/pipcook/doc/Quick%20Start-en)<br />**
```
docker pull pipcook/pipcook
```

<a name="XZqjF"></a>
### An example

---

Here let us show you an example how you can use pipcook-python-node to take advantage of the python ecosystem. This example is about a deep learning training, showing how we use Keras (a well-known tensorflow-based python high-level deep learning framework) for deep convolutional network training in js. For better illustration, we will compare Do the same with python and js

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

From the comparison of the above two pieces of code, we can see that we try to make the most of the pipcook-python-node API as python as possible. Due to the differences between the two languages, the above two pieces of code are different as follows：

- Because Python supports named arguments for functions and JS does not, so we use `python.nA`  instead. NA stands for named argument. As in the above code, we assign `python.nA`  to `_` , so we can use `model.add(Dense(256, _({activation: 'relu'))))`  instead of `model.add(Dense (256, activation='relu'))`
- pipcook will use the pipcook_venv python virtual environment of the workspace. If it is detected that the current workspace does not have this virtual environment, we will create one. You can use our API: python.install to install the python library, or you can manually enter this virtual environment to install For more information about the python virtual environment, you can refer [here](https://virtualenv.pypa.io/en/latest/)
- We provide API: python.import instead of the native import keyword
- We will introduce more pipcook-python-node APIs later


<a name="4ycEM"></a>
### API Introduction

---


<a name="U1uJE"></a>
#### Python.scope (scopeName: string, callback: Function)

- scopeName: scope is used to identify a python workspace. Each scope has its own independent execution environment. In pipcook-python-node, multiple workspaces can be defined simultaneously, corresponding to multiple ipython kernels.
- callback: This callback function will pass an instance of the Python class to the user. This instance is bound to a workspace that can perform the corresponding operations and python code
- Return: Promise <void>

This function is a static method of the Python class. It returns a python instance for the user. After that, you can use various methods of the python instance to execute python commands.

<a name="V00tX"></a>
#### python.import (packageName: string)

- PackageName: the name of the python library
- Return: PythonObject

This method is used to introduce the python package, which is equivalent to import xxx in python. The method returns a python object that we abstract and define in js.

<a name="XHo12"></a>
#### python.fromImport (packageName: stirng, importNames: string [])

- PackageName: the name of the python library
- importNames: the names to be loaded
- Return: PythonObject []

Similar to from ... import ..., the names of PythonObjects will be returned in the order of the importName array

<a name="2d6Su"></a>
#### python.install (packageName: string, version ?: string)

- PackageName: the name of the python library
- version: version
- Return: void

This method is used to install python packages, which is equivalent to executing pip install xxx. If the version is not specified, the latest stable version will be installed. If you need to use more complex pip install, you can refer to the python.runshell command

<a name="zYPIE"></a>
#### python.runshell (command: string)

- Command: the shell command you want to execute
- Return: void

This method is used to execute commands in the shell and can be any command supported by the current system

<a name="l9HgL"></a>
#### python.createNumber (number: number)

- number: number
- Return: PythonObject

Create a PythonObject object representing the basic type-number in python. In fact, for basic types, it is also possible to directly pass the basic type of js into the function, because we will do some invisible conversion automatically, but we recommend that you use PythonObject To avoid some unexpected situations

<a name="R9xHf"></a>
#### python.createString (string: string, isRaw ?: boolean)

- string: string
- IsRaw: whether to use raw strings, equivalent to r '.....' in python
- Return: PythonObject

Create a PythonObject object representing a primitive type in Python-a string

<a name="6NzSt"></a>
#### python.createBoolean (value: boolean)

- value: true or false
- Return: PythonObject

Create a PythonObject object representing a basic type-boolean in Python

<a name="hCklS"></a>
#### python.createNone ()

- Return: PythonObject

Create a PythonObject object representing the basic type in Python-None

<a name="pURTx"></a>
#### python.createTuple (value: PythonObject [])

- Value: an array of primitive types or an array of PyhtonObject
- Return PythonObject

Create a PythonObject object with basic types-tuples in Python

<a name="oXVFN"></a>
#### python.createList (value: PythonObject [])

- Value: an array of primitive types or an array of PyhtonObject
- Return PythonObject
- <br />

Create a Basic Type in Python-List of PythonObject Objects

<a name="BPDrZ"></a>
#### python.createDictionary (value: object)

- Value: object
- Return PythonObject

Currently only supports key, value is PythonObject or dictionary of basic type

<a name="332bZ"></a>
#### python.equal (object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject
- Return: PythonObject

This method compares two python objects, which is equivalent to the python comparison operator ==

<a name="WszxP"></a>
#### python.notEqual (object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject
- Return: PythonObject

This method compares two python objects, which is equivalent to the python comparison operator! =

<a name="c1Cbm"></a>
#### python.larger (object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject
- Return: PythonObject

This method compares two python objects, which is equivalent to the python comparison operator a> b

<a name="HX9DG"></a>
#### python.smaller (object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject
- Return: PythonObject

This method compares two python objects, which is equivalent to the python comparison operator a <b

<a name="xzpvL"></a>
#### python.largerEqual (object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject
- Return: PythonObject

This method compares two python objects, which is equivalent to the python comparison operator a> = b

<a name="BFTjJ"></a>
#### python.smallerEqual (object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject
- Return: PythonObject

This method compares two python objects, which is equivalent to the python comparison operator a <= b

<a name="b0vFy"></a>
#### python.largerEqual (object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject
- Return: PythonObject

This method compares two python objects, which is equivalent to the python comparison operator a> = b

<a name="L0H83"></a>
#### python.and (object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject
- Return: PythonObject

This method compares two python objects, which is equivalent to the python logical operators a and b

<a name="rNiGr"></a>
#### python.or (object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject
- Return: PythonObject

This method compares two python objects, which is equivalent to the python logical operators a or b

<a name="qFwFZ"></a>
#### python.not (object: PythonObject)

- object1: PythonObject
- object2: PythonObject
- Return: PythonObject

This method compares two python objects, which is equivalent to the python logical operator not

<a name="nzbMB"></a>
#### python.if (condition: PythonObject, execution: Function)

- Condition: condition of the if statement
- execution: the contents of an if statement

This method is equivalent to a conditional operation. When using pipcook-python-node, please use the if method provided by us instead of the js native if

<a name="bONfu"></a>
#### python.add (object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject

This method operates on two python objects, equivalent to a + b in python

<a name="WMx6R"></a>
#### python.minus (object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject

This method operates on two python objects, equivalent to a-b in python

<a name="DdwKK"></a>
#### python.multiply (object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject

This method operates on two python objects, equivalent to a * b in python

<a name="2NhnA"></a>
#### python.divide (object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject

This method operates on two python objects, equivalent to a / b in python

<a name="L5iLj"></a>
#### python.add (object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject

This method operates on two python objects, equivalent to a + b in python

<a name="6q5Pl"></a>
#### python.mod (object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject

This method operates on two python objects, equivalent to a% b in python

<a name="BNSGG"></a>
#### python.pow (object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject

This method operates on two python objects, equivalent to a ** b in python


<a name="mLRwI"></a>
#### python.floorDivide(object1: PythonObject, object2: PythonObject)

- object1: PythonObject
- object2: PythonObject

This method operates on two python objects, equivalent to a // b in python

<a name="SZzAK"></a>
#### python.runRaw(raw: string)

- raw: the python statement to be executed
- Return: PythonObject

This method is used to execute native python statements. This method is not recommended. If you are sure that the API we provide at this stage cannot meet your requirements, you can use this method, mainly using Python.convert (PythonObject) escape, for example:

```
const number1 = python.createNumber(2)
const number2 = python.createNumber(3)
const result = pyhton.runRaw(`${Python.convert(number1)} + ${Python.convert(number2)}`);
```

<a name="HwV0G"></a>
#### python.evaluate (object: PythonObject)

- object: PythonObject
- Return: `{ type: string; value: string; }`

This method is used to return the value of the python object represented by the current PythonObject. The returned value includes the python object type and the value of the python object, both of which are string types. We will support custom converters in the future, which can be converted into js objects according to type and value

<a name="CKZOM"></a>
#### python.createNumpyFromTf (tensor: tf.Tensor)
• tensor: tf.Tensor: a tfjs tensor<br />• Return: PythonObject

Convert tfjs tensor in js to numpy object in python

<a name="zi10V"></a>
#### python.reconnect ()
Refresh the ipython kernel. In some cases, if you execute some installation statements, you may need to rechain the kernel to take effect.

