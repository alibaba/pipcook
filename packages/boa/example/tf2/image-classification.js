'use strict';

// See https://www.tensorflow.org/tutorials/keras/classification

const boa = require('../../');
const path = require('path');
const argv = process.argv.slice(2);

const { tuple } = boa.builtins();
const tf = boa.import('tensorflow');
const tfds = boa.import('tensorflow_datasets');
const np = boa.import('numpy');
const matplotlib = boa.import('matplotlib');
matplotlib.use('agg'); // disable gui
const plt = boa.import('matplotlib.pyplot');

const { keras } = tf;
const { layers } = keras;

const [
  [train_images, train_labels],
  [test_images, test_labels]
] = keras.datasets.fashion_mnist.load_data();

const train_batches = boa.eval`${train_images} / 255.0`;
const test_batches = boa.eval`${test_images} / 255.0`;

// configure model
const model = keras.Sequential([
  keras.layers.Flatten(boa.kwargs({
    input_shape: tuple([28, 28]),
  })),
  keras.layers.Dense(128, boa.kwargs({
    activation: 'relu',
  })),
  keras.layers.Dense(10, boa.kwargs({
    activation: 'softmax',
  })),
]);

function showimg(name, img) {
  plt.figure();
  plt.imshow(img);
  plt.colorbar();
  plt.grid(false);
  plt.savefig(name);
}

// configure checkpoints
const checkpoint = {
  dir: '.checkpoints/tf2/image-classification',
  get prefix() {
    return path.join(this.dir, 'ckpt_0');
  },
};

if (argv[0] == 'train') {
  const callback = tf.keras.callbacks.ModelCheckpoint(
    boa.kwargs({
      filepath: checkpoint.prefix,
      save_weights_only: true,
    })
  );
  model.compile(boa.kwargs({
    optimizer: 'adam',
    loss: 'sparse_categorical_crossentropy',
    metrics: ['accuracy'],
  }));
  model.fit(train_batches, train_labels, boa.kwargs({
    epochs: 10,
    callbacks: [callback],
  }));
} else if (argv[0] == 'restore') {
  const latest = tf.train.latest_checkpoint(checkpoint.dir);
  model.load_weights(latest);
  model.build(tf.TensorShape([1, null]));

  // predict
  const o = test_batches[parseInt(argv[1] || 0)];
  const img = np.expand_dims(o, 0);
  const p = model.predict(img);
  console.log(np.argmax(p[0]));
  showimg('test.png', o);
}

model.summary();
