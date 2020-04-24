
const boa = require('@pipcook/boa');

const tf = boa.import('tensorflow');

const n1 = tf.add(1, 2).numpy();
console.log(n1); // 3

const n2 = tf.constant('Hello, TensorFlow!').numpy();
console.log(n2); // b'Hello, TensorFlow!'
