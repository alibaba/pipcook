const {Python} = require('../dist/index');

const tf = require('@tensorflow/tfjs-node-gpu');

async function train () {
  await Python.scope('test1', async (python) => {
    const aa = python.runRaw(`
    fdsa
    f  fds
    `)
  });
}

train();

