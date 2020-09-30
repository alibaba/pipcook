const test = require('tape');
const { Worker, isMainThread, workerData, parentPort } = require('worker_threads');
const boa = require('../../');
const pybasic = boa.import('tests.base.basic');
const { SharedPythonObject, symbols } = boa;

class Foobar extends pybasic.Foobar {
  hellomsg(x) {
    return `hello <${x}> on ${this.test}(${this.count})`;
  }
}

if (isMainThread) {
  test('async worker', t => {
    t.plan(4);

    const foo = new Foobar();
    const descriptor = foo.toString();
    console.log(`create a foo object with ownership(${foo[symbols.GetOwnershipSymbol]()})`);
  
    const worker = new Worker(__filename, {
      workerData: {
        foo: new SharedPythonObject(foo),
      },
    });
    console.log('main: worker is started and send an object', descriptor);
    t.throws(() => foo.toString(), 'Object is owned by another thread.');

    let expectedOwnership = false;
    let alive = setInterval(() => {
      const ownership = foo[symbols.GetOwnershipSymbol]();
      t.equal(ownership, expectedOwnership, `ownership should be ${expectedOwnership}.`);
    }, 1000);
  
    worker.on('message', state => {
      if (state === 'done') {
        expectedOwnership = true;
        console.log('train task is completed');
        setTimeout(() => {
          clearInterval(alive);
          console.log(foo.ping('x'));
          t.end();
        }, 1000);
      }
    });
  });
} else {
  const { foo } = workerData;
  console.log(`worker: get an object${foo} and sleep 5s in Python`);
  foo.sleep();
  
  console.log('python sleep is done, and sleep in nodejs(thread)');
  setTimeout(() => {
    parentPort.postMessage('done');
  }, 1000);
}
