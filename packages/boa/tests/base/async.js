const { Worker, isMainThread, workerData, parentPort } = require('worker_threads');
const boa = require('../../');
const pybasic = boa.import('tests.base.basic');
const { SharedPythonObject, GetOwnershipSymbol } = boa;

class Foobar extends pybasic.Foobar {
  hellomsg(x) {
    return `hello <${x}> on ${this.test}(${this.count})`;
  }
}

if (isMainThread) {
  const foo = new Foobar();
  const descriptor = foo.toString();
  console.log(`create a foo object with ownership(${foo[GetOwnershipSymbol]()})`);

  const worker = new Worker(__filename, {
    workerData: {
      foo: new SharedPythonObject(foo),
    },
  });
  console.log('main: worker is started and send an object', descriptor);
  let alive = setInterval(() => {
    console.log(`main: still training, ownership(${foo[GetOwnershipSymbol]()})`);
  }, 1000);

  worker.on('message', (state) => {
    if (state === 'done') {
      console.log('train task is completed');
      setTimeout(() => {
        clearInterval(alive);
      }, 1000);
    }
  });
} else {
  const { foo } = workerData;
  console.log(`worker: get an object${foo} and sleep 5s in Python`);
  foo.sleep();
  
  console.log('python sleep is done, and sleep in nodejs(thread)');
  setTimeout(() => {
    parentPort.postMessage('done');
  }, 2000);
}
