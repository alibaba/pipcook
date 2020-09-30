const { Worker, isMainThread, workerData, parentPort } = require('worker_threads');
const boa = require('../../');
const pybasic = boa.import('tests.base.basic');

class Foobar extends pybasic.Foobar {
  hellomsg(x) {
    return `hello <${x}> on ${this.test}(${this.count})`;
  }
}

if (isMainThread) {
  const f = new Foobar();
  const worker = new Worker(__filename, {
    env: {
      ...process.env
    },
    workerData: {
      fpointer: f.toPointer(),
    },
  });
  console.log('main: worker is started and send an object', f);
  let alive = setInterval(() => {
    console.log('main: still training...');
  }, 1000);

  worker.on('message', (state) => {
    if (state === 'done') {
      clearInterval(alive);
      console.log('train task is completed');
    }
  });
} else {
  const f = boa.from(workerData.fpointer);
  console.log(`worker: get an object<${f}> and start train`);
  f.sleep();
  parentPort.postMessage('done');
}
