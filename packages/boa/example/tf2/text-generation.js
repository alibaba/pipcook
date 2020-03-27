'use strict';

const boa = require('../../');
const fs = require('fs');
const path = require('path');
const argv = process.argv.slice(2);

const tf = boa.import('tensorflow');
const np = boa.import('numpy');
const { sorted, set, len, tuple, enumerate, zip } = boa.builtins();

const datafile = tf.keras.utils.get_file('shakespeare.txt',
  'https://storage.googleapis.com/download.tensorflow.org/data/shakespeare.txt');
const text = fs.readFileSync(datafile, 'utf8');

const vocab = sorted(set(text));
const char2idx = boa.eval`{u:i for i, u in enumerate(${vocab})}`;
const idx2char = np.array(vocab);

const text_as_int = np.array(boa.eval`[${char2idx}[c] for c in ${text}]`);
const seq_length = 100;
const examples_per_epoch = len(text);
const char_dataset = tf.data.Dataset.from_tensor_slices(text_as_int);
const sequences = char_dataset.batch(seq_length + 1, boa.kwargs({
  drop_remainder: true,
}));
let dataset = sequences.map(function split_input_target(chunk) {
  const input = boa.eval`${chunk}[:-1]`;
  const target = boa.eval`${chunk}[1:]`;
  return tuple([input, target]);
});

// Batch size
const BATCH_SIZE = argv[0] === 'train' ? 64 : 1;

// Length of the vocabulary in chars
const vocab_size = len(vocab)

// The embedding dimension
const embedding_dim = 256

// Number of RNN units
const rnn_units = 1024

// shuffle the dataset
dataset = dataset.shuffle(10000)
                 .batch(BATCH_SIZE, boa.kwargs({ drop_remainder: true }));

function buildModel(vocab_size, embedding_dim, rnn_units, batch_size) {
  return tf.keras.Sequential([
    tf.keras.layers.Embedding(vocab_size, embedding_dim, boa.kwargs({
      batch_input_shape: [batch_size, null]
    })),
    tf.keras.layers.GRU(rnn_units, boa.kwargs({
      return_sequences: true,
      stateful: true,
      recurrent_initializer: 'glorot_uniform',
    })),
    tf.keras.layers.Dense(vocab_size)
  ]);
}

// configure model
const model = buildModel(vocab_size, embedding_dim, rnn_units, BATCH_SIZE);

function loss(labels, logits) {
  return tf.keras.losses.sparse_categorical_crossentropy(labels, logits, boa.kwargs({
    from_logits: true,
  }));
}

function gentext(startStr) {
  let input_eval;
  const num_generate = 1000;

  input_eval = boa.eval`[${char2idx}[s] for s in ${startStr}]`;
  input_eval = tf.expand_dims(input_eval, 0);

  const text_generated = [];
  model.reset_states();

  for (let i = 0; i < num_generate; i++) {
    let p = model(input_eval);
    p = tf.squeeze(p, 0);
    p = boa.eval`${p} / 1.0`;
    const tmp = tf.random.categorical(p, boa.kwargs({
      num_samples: 1
    }));
    const id = parseInt(boa.eval`${tmp}[-1,0].numpy()`);
    input_eval = tf.expand_dims([id], 0);
    text_generated.push(idx2char[id]);
  }
  return startStr + text_generated.join('');
}

// configure checkpoints
const checkpoint = {
  dir: '.checkpoints/tf2/text-generation',
  get prefix() {
    return path.join(this.dir, 'ckpt_');
  },
};

if (argv[0] === 'train') {
  const callback = tf.keras.callbacks.ModelCheckpoint(
    boa.kwargs({
      filepath: checkpoint.prefix,
      save_weights_only: true,
    })
  );
  model.compile(boa.kwargs({ optimizer: 'adam', loss }));
  model.fit(dataset, boa.kwargs({
    epochs: 5,
    callbacks: [callback],
  }));
} else if (argv[0] === 'restore') {
  const latest = tf.train.latest_checkpoint(checkpoint.dir);
  model.load_weights(latest);
  model.build(tf.TensorShape([1, null]));
  console.log('load model from', latest);
}

// output the summary of this model
model.summary();
console.log(gentext(argv[1] || 'REMO:'));
