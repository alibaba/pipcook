'use strict';

const fs = require('fs');
const boa = require('@pipcook/boa');
const argv = process.argv.slice(2);

const { tuple, range, len, enumerate } = boa.builtins();
const tf = boa.import('tensorflow');
const tfds = boa.import('tensorflow_datasets');

const { keras } = tf;
const { layers } = keras;

const embedding_layer = layers.Embedding(1000, 5);
const [
  [train_data, test_data],
  info
] = tfds.load('imdb_reviews/subwords8k', boa.kwargs({
  split: tuple([tfds.Split.TRAIN, tfds.Split.TEST]),
  with_info: true,
  as_supervised: true,
}));

const encoder = info.features['text'].encoder;
const padded_shapes = tuple([
  [null], tuple([])
]);
const train_batches = train_data.shuffle(1000)
                                .padded_batch(10, boa.kwargs({ padded_shapes }));
const test_batches = test_data.shuffle(1000)
                              .padded_batch(10, boa.kwargs({ padded_shapes }));

const embedding_dim = 16;
const model = keras.Sequential([
  layers.Embedding(encoder.vocab_size, embedding_dim),
  layers.GlobalAveragePooling1D(),
  layers.Dense(16, boa.kwargs({ activation: 'relu' })),
  layers.Dense(1, boa.kwargs({ activation: 'sigmoid' })),
]);

model.summary();
model.compile(boa.kwargs({
  optimizer: 'adam',
  loss: 'binary_crossentropy',
  metrics: ['accuracy']
}));

const result = model.fit(train_batches, boa.kwargs({
  epochs: 1,
  validation_data: test_batches,
  validation_steps: 20,
}));

{
  const vecs = fs.createWriteStream('vecs.tsv');
  const meta = fs.createWriteStream('meta.tsv');
  const weights = model.layers[0].get_weights()[0]
  enumerate(encoder.subwords).forEach((word, n) => {
    const vec = weights[n + 1];
    const line = (boa.eval`'\t'.join([str(x) for x in ${vec}])`);
    meta.write(`${word}\n`, 'utf8');
    vecs.write(`${line}\n`, 'utf8');
  });
  meta.end();
  vecs.end();
}