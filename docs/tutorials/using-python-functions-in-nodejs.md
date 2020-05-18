# Using Python functions in Node.js

Boa's main purpose is to allow you to use Python interfaces and functions in Node.js. 
Maybe you will be curious, confused, and puzzled when I see it here. My Node.js magic 
is so good. Why use Python? If you have tried some applications of JavaScript for 
machine learning before, you will understand the reason behind this.

The current situation is that the machine learning ecosystem is almost tied to Python. 
The language is iterating at high speed, and JavaScript can only count on its own. If 
we expect to achieve Python’s current scale from zero, the amount of work required is 
huge. When I wrote [tensorflow-nodejs](https://github.com/yorkie/tensorflow-nodejs) 
years ago, I already thought so.

Therefore, we must change our thinking. Since we can’t surpass Python, then will use 
Python. For developers of scripting languages, they don’t really care how the low-level 
layer is implemented, as long as the high-level language and interface are familiar to 
me, so [Boa](https://github.com/alibaba/pipcook/tree/master/packages/boa) is a Node.js 
library born for this, which bridges [CPython](https://github.com/python/cpython) to 
provide JavaScript with the ability to access the complete Python ecosystem, and in 
addition, with the help of ES6 new features to provide users with a seamless development 
experience, so what is the experience?

Let’s look at a simple example:

```js
const boa = require('@pipcook/boa');  
const os = boa.import('os');  
console.log(os.getpid()); // prints the pid from python.  
// using keyword arguments namely \`kwargs\`  
os.makedirs('..', boa.kwargs({  
  mode: 0x777,  
  exist\_ok: false,  
}));  
// using bult-in functions  
const { range, len } = boa.builtins();  
const list = range(0, 10); // create a range array  
console.log(len(list)); // 10  
console.log(list\[2\]); // 2
```

Isn’t it simple enough? Just load the Python object through boa.import, and the remaining 
object access, function call, and array access are no different from our JavaScript.

```js
const boa = require('@pipcook/boa');  
const tf = boa.import('tensorflow');  
const { layers, Model } = tf.keras;

class TestModel extends Model {  
  constructor() {  
    super();  
    this.conv1 = layers.Conv2D(32, 3, boa.kwargs({ activation: 'relu' }));  
    this.flatten = layers.Flatten();  
    this.d1 = layers.Dense(128, boa.kwargs({ activation: 'relu' }));  
    this.d2 = layers.Dense(10, boa.kwargs({ activation: 'softmax' }));  
  }  
  call(x) {  
    return this.conv1(x)  
      .flatten(x)  
      .d1(x).d2(x);  
  }   
}
```

The above example shows how to use TensorFlow to create a model, in addition to demonstrating 
how to inherit from a Python class from JavaScript. Is this very JavaScript style?

It is worth mentioning that, in the [Boa](https://github.com/alibaba/pipcook/tree/master/packages/boa) 
internals, there is no encapsulation of TensorFlow and other frameworks, as long as you install 
the corresponding package through Python locally, it can be used like the above code, so in theory 
you can use any Python package does what is done above.

See [examples/boa](https://github.com/alibaba/pipcook/tree/master/example/boa) for more examples that is
written in Boa.

## Overview

If you are a plugin developer, then you do not need any installation operation, Pipcook will install Boa
for you. Or you want to use it independently? You can install it via npm:

```sh
$ npm install @pipcook/boa
```

Next, we will introduce some of main methods.

### builtins()

Python will build some common functions in its builtins, the specific API list is at: [https://docs.python.org/3.7/library/functions.html](https://docs.python.org/3.7/library/functions.html), 
then [Boa](https://github.com/alibaba/pipcook/tree/master/packages/boa) also provides corresponding way to use them:

```js
const { len, list, range } = boa.builtins();
```

### import(name)

In addition to the built-in methods, the most important function is to load Python packages, so import is to do this.

```js
const np = boa.import('numpy');
```

### kwargs(map)

Next is the keyword arguments. In Python, there is a way to use map to represent parameters, such as:

```py
foobar(100, x=10, y=20)
```

It helps the caller understand the meaning of each parameter better. For this reason, the kwargs method 
has been added to Boa to support this usage:

```js
foobar(100, boa.kwargs({ x: 10, y: 20 }));
```

### with(ctx, fn)

“with” may be familiar to some people who are familiar with the history of JavaScript, but “with” in 
Python, its usage and purpose are not the same as JavaScript. The with-statement in Python is a bit 
similar to Block Scoping in JavaScript:

```py
with(localcontext()) {  
  \# balabala  
}
```

The above code saves the state of localcontext(), then starts executing the block code in the 
with-statement, and finally, releases the state of localcontext().

The internal implementation mechanism is that each variable passed into the with-statement needs 
to implement two magic methods: \_\_enter\_\_ and \_\_exit\_\_, and then called before and after 
the block code execution.

### eval(str)

The last to tell is to evaluate Python expressions (single line). Why should we provide such a 
method? This still has to talk about the advantages of Python. In some very complex data processing 
scenarios, Python expressions can still be expressed very simply and understandably, which greatly 
reduces the complexity of the code. Let’s take a look at an example:

```js
const line = (boa.eval\`'\\t'.join(\[str(x) for x in ${vec}\])\`);
```

If the above code is to be replaced with JavaScript:

```js
vec.map(x => x.toString()).join('\\t');
```

How much does it seem to be almost right? Then take a look at the following example:

```js
boa.eval\`{u:i for i, u in enumerate(${vocab})}\`;  
boa.eval\`\[${char2idx}\[c\] for c in ${text}\]\`;
boa.eval\`${chunk}\[:-1\]\`;
boa.eval\`${chunk}\[0:-1:2\]\`;
```

How about it, does it feel like the above example can’t be done with a simple line of JavaScript?

> *However, it is worth mentioning that JavaScript is gradually making up in this regard. there 
> are some related standards that TC39 is doing, including the above Slice Notation.*

Speaking of returning to eval, it is like a supplement to JavaScript. Before some standards have 
been implemented and stabilized, it allows us to use Python expressions to express more simply, 
and all we need is some low-cost learning. That’s it.

Next, let’s talk about how eval is used. It accepts a “string”, but we generally pass Template 
String when using it. Let’s look at two examples first:

```js
boa.eval('print("foobar")');
boa.eval(\`print("${txt}")\`);
```

After reading the above 2 lines of code, they are relatively rare usages. The most commonly used 
and most effective eval is the use of Tagged Template String. This usage is just like what we saw 
at the beginning. The content of the template string is directly followed by eval. The advantage 
of this is that the eval function will receive To all the template parameters, so that we can open 
up JavaScript objects and Python expressions to achieve a smoother user experience, as follows:

```js
const chunk = range(0, 10);  
boa.eval\`${chunk}\[0:-1:2\]\`;
```

The above is to transfer the chunk to the expression, and then get the corresponding value through 
the Slice Notation syntax of Python, and finally return to the world of JavaScript.

## Summary

Well, the simple API introduction will come here first. If you want to learn more about API and Boa,
you can go to our guide: [Introduction to Boa](../manual/intro-to-boa.md).

Finally, let’s talk about original intention of Boa, which is to allow JavaScript developers to use Python’s 
rich machine learning ecosystem more seamlessly. It can be said that starting today, you can start looking 
at Python documentation and use JavaScript to “learn and use” machine learning and deep learning!
