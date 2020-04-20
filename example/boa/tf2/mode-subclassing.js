'use strict';

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

const model = new TestModel();
const tape = tf.GradientTape();
console.log(model, tape);
