const { Python } = require('../dist/index');

async function train () {
  await Python.scope('test1', (python) => {
    const _ = python.nA;
    python.install('numpy');
    python.install('keras');
    python.install('tensorflow');
    const np = python.import('numpy');
    const keras = python.import('keras');
    const [ Sequential ] = python.fromImport('keras.models', [ 'Sequential' ]);
    const [ Dense, Flatten ] = python.fromImport('keras.layers', [ 'Dense', 'Dropout', 'Flatten' ]);
    const [ Conv2D ] = python.fromImport('keras.layers', [ 'Conv2D', 'MaxPooling2D' ]);
    const [ SGD ] = python.fromImport('keras.optimizers', [ 'SGD' ]);

    const x_train = np.random.random([ 100, 100, 100, 3 ]);
    const y_train = keras.utils.to_categorical(np.random.randint(10, _({ size: [ 100, 1 ] })), _({ num_classes: 10 }));

    const model = Sequential();

    model.add(Conv2D(32, [ 3, 3 ], _({ activation: 'relu', input_shape: [ 100, 100, 3 ] })));

    model.add(Flatten());
    model.add(Dense(256, _({ activation: 'relu' })));
    model.add(Dense(10, _({ activation: 'softmax' })));

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

    model.fit(x_train, y_train, _({ batch_size: 32, epochs: 1 }));
  });
}

train();

