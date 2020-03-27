'use strict';

const boa = require('../../');
const { builtins, kwargs } = boa;
const { tuple } = builtins();
const tf = boa.import('tensorflow');
const {
  datasets,
  layers,
  models,
} = tf.keras;

const [[x_train, y_train], [x_test, y_test]] = datasets.mnist.load_data();
// numpy.ndarray __truediv__ operator method

const inputOfShape = tuple([28, 28]);
const model = models.Sequential([
  layers.Flatten(kwargs({ input_shape: inputOfShape })),
  layers.Dense(128, kwargs({ activation: 'relu' })),
  layers.Dropout(0.2),
  layers.Dense(10, kwargs({ activation: 'softmax' }))
]);
model.compile(kwargs({
  optimizer: 'adam',
  loss: 'sparse_categorical_crossentropy',
  metrics: ['accuracy'],
}));
model.fit(x_train, y_train, kwargs({ epochs: 5 }));
model.evaluate(x_test, y_test);
