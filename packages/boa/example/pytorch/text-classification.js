'use strict';

// See https://pytorch.org/tutorials/beginner/text_sentiment_ngrams_tutorial.html

const boa = require('../../');
const { len, tuple, enumerate } = boa.builtins();
const torch = boa.import('torch');
const torchtext = boa.import('torchtext');
const { nn, optim } = torch;

const { DataLoader, dataset } = torch.utils.data;
const { text_classification } = torchtext.datasets;
const [train_dataset] = text_classification.DATASETS['AG_NEWS'](boa.kwargs({
  root: './.data',
  ngrams: 2,
  vocab: null,
}));

class TextSentiment extends nn.Module {
  constructor(sizeOfVocab, dimOfEmbed, numOfClass) {
    super();
    this.embedding = nn.EmbeddingBag(sizeOfVocab, dimOfEmbed, boa.kwargs({
      sparse: true,
    }));
    this.fc = nn.Linear(dimOfEmbed, numOfClass);
    this.init_weights();
  }
  init_weights() {
    const initrange = 0.5
    this.embedding.weight.data.uniform_(-initrange, initrange);
    this.fc.weight.data.uniform_(-initrange, initrange);
    this.fc.bias.data.zero_();
  }
  forward(text, offsets) {
    const embedded = this.embedding(text, offsets);
    return this.fc(embedded);
  }
}

function generateBatch(batch) {
  let label = [];
  let text = [];
  let offsets = [0];
  enumerate(batch).forEach(entry => {
    label.push(entry[0]);
    const [, item] = entry;
    text.push(item);
    offsets.push(len(item));
  });

  label = torch.tensor(label);
  offsets = torch.tensor(offsets.slice(0, -1)).cumsum(boa.kwargs({
    dim: 0,
  }));
  text = torch.cat(text);
  return tuple([text, offsets, label]);
}

const device = torch.device('cpu');
const EMBED_DIM = 32;
const N_EPOCHS = 5;
const VOCAB_SIZE = len(train_dataset.get_vocab());
const NUM_CLASS = len(train_dataset.get_labels());

const train_len = len(train_dataset) * 0.95;
const [sub_train_, sub_valid_] =
  dataset.random_split(train_dataset, [train_len, len(train_dataset) - train_len]);
console.log(sub_train_, sub_valid_);

// create model
console.log(`VOCAB_SIZE=${VOCAB_SIZE} EMBED_DIM=${VOCAB_SIZE} NUM_CLASS=${NUM_CLASS}`);
const model = (new TextSentiment(VOCAB_SIZE, EMBED_DIM, NUM_CLASS)).to(device);
console.log(model);

// const N_EPOCHS = 5;
const criterion = nn.CrossEntropyLoss().to(device);
const optimizer = optim.SGD(model.parameters(), boa.kwargs({
  lr: 4.0,
}));
const scheduler = optim.lr_scheduler.StepLR(optimizer, 1, boa.kwargs({
  gamma: 0.9,
}));

function train(sub) {
  // train the model
  let trainLoss = 0;
  let trainAcc = 0;

  const data = DataLoader(sub, boa.kwargs({
    batch_size: 16,
    shuffle: true,
    collate_fn: generateBatch,
  }));

  enumerate(data).forEach((item, idx) => {
    optimizer.zero_grad();
    const text = item[0].to(device);
    const offsets = item[1].to(device);
    const cls = item[2].to(device);
    const output = model(text, offsets);
    const loss = criterion(output, cls);
    trainLoss += loss.item();
    loss.backward();
    optimizer.step();
    trainAcc += boa.eval`(${output.argmax(1)} == ${cls}).sum().item()`;
  });
  scheduler.step();
  return [
    trainLoss / len(sub_train_),
    trainAcc / len(sub_train_),
  ];
}

function valid(data_) {
  let validLoss = 0;
  let validAcc = 0;

  const data = DataLoader(data_, boa.kwargs({
    batch_size: 16,
    collate_fn: generateBatch,
  }));

  enumerate(data).forEach((item, idx) => {
    const text = item[0].to(device);
    const offsets = item[1].to(device);
    const cls = item[2].to(device);
    boa.with(torch.no_grad(), () => {
      const output = model(text, offsets);
      const loss = criterion(output, cls);
      validLoss += loss.item();
      validAcc += boa.eval`(${output.argmax(1)} == ${cls}).sum().item()`;
    });
  });
  return [
    validLoss / len(data_),
    validAcc / len(data_),
  ];
}

const [trainLoss, trainAcc] = train(sub_train_);
console.log('\tLoss: %d(train)\t|\tAcc: %d(train)', trainLoss, trainAcc);
const [validLoss, validAcc] = valid(sub_valid_);
console.log('\tLoss: %d(valid)\t|\tAcc: %d(valid)', validLoss, validAcc);
