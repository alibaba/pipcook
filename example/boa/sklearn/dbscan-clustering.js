'use strict';

const boa = require('@pipcook/boa');
const fs = require('fs');
const glob = require('glob').sync;
const acorn = require('acorn');

const { set, len, list } = boa.builtins();
const { DBSCAN } = boa.import('sklearn.cluster');
const { StandardScaler } = boa.import('sklearn.preprocessing');
const { word2vec } = boa.import('gensim.models');
const np = boa.import('numpy');
const plt = boa.import('matplotlib.pyplot');

const cwd = process.cwd();
let files = [];
files = files.concat(glob(cwd + '/lib/**/*.js'));
files = files.concat(glob(cwd + '/example/**/*.js'));
files = files.concat(glob(cwd + '/node_modules/**/*.js'));

const sentences = [];
const vec2word = {};
const samples = files
  .map(f => fs.readFileSync(f))
  .map(s => {
    let ast;
    try { ast = acorn.parse(s) } catch (e) { }
    return ast;
  })
  .filter(ast => ast !== undefined)
  .reduce((list, ast) => {
    const fn = ast.body.filter(stmt => stmt.type === 'FunctionDeclaration');
    list = list.concat(fn);
    return list;
  }, []);

samples.forEach(sample => sentences.push([sample.id.name]));

const { wv } = word2vec.Word2Vec(sentences, boa.kwargs({
  workers: 1,
  size: 2,
  min_count: 1,
  window: 3,
  sg: 0
}));

const X = sentences
  .map(s => wv.__getitem__(s)[0])
  .map((v, i) => {
    const r = [v[0] * 100, v[1] * 100];
    vec2word[r] = samples[i].id.name;
    return r;
  });

const db = DBSCAN(boa.kwargs({ eps: 0.9 })).fit(X);
const labels = db.labels_;
const n_noise_ = list(labels).count(-1);
const n_clusters_ = len(set(labels));
console.log(n_noise_, n_clusters_, set(labels));

for (let i = 0; i < len(labels); i++) {
  if (labels[i] !== '-1') {
    console.log(i, labels[i], vec2word[X[i]]);
  }
}