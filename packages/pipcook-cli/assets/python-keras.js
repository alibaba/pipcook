
/**
 * This is an example to run Python keras in pipcook-python-node.
 * 
 * Use Python.install to install python packages
 * Use Python.import to import python packages
 * Use python.nA to specify names parameters.
 * For others, just use it as python, but acutally we are writing JS codes!
 * 
 * For more information, Please refer to https://github.com/alibaba/pipcook/wiki/%E6%83%B3%E8%A6%81%E4%BD%BF%E7%94%A8python%EF%BC%9F
 */


const {Python} = require('@pipcook/pipcook-python-node');

async function train () {
  await Python.scope('test1', (python) => {
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
}

train();

