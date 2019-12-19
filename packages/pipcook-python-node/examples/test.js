const {Python} = require('../dist/index');

const tf = require('@tensorflow/tfjs-node-gpu');

async function train () {
  await Python.scope('test1', async (python) => {
    const aa = python.import('numpy');
    python.print(aa);
    await python.reconnet();
    const bb = python.import('numpy');
    python.print(bb);
  });
}

train();

