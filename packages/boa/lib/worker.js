'use strict';

let isMainThread = false;
let workerData = null;
let supportWorkerThreads = false;

const { PythonObject, NODE_PYTHON_HANDLE_NAME } = require('bindings')('boa');
const { wrap } = require('./proxy');

const TYPE_ID = 'SHARED_PYTHON_OBJECT_TYPE';
if (process.moduleLoadList.indexOf('NativeModule worker_threads') > 0) {
  [isMainThread, workerData] = require('worker_threads');
  supportWorkerThreads = true;
}

/**
 * This is a wrapper for shared Python object, just like
 * v8's `SharedArrayBuffer`.
 */
class SharedPythonObject {
  constructor(o) {
    if (!supportWorkerThreads) {
      throw new TypeError('worker_threads is not supported, please upgrade your Node.js');
    }
    if (!isMainThread) {
      throw new TypeError('SharedPythonObject must be used in main thread.');
    }
    this.ownershipId = o[NODE_PYTHON_HANDLE_NAME].requestOwnership();
    this.__type__ = TYPE_ID;
  }
}

function isSharedPythonObject(obj) {
  // TODO: verify if the ownership id is valid id?
  return typeof obj.ownershipId === 'number' && obj.__type__ === TYPE_ID;
}

if (!isMainThread) {
  const sharedPythonObjectMaps = [];

  for (let name in workerData) {
    if (Object.prototype.hasOwnProperty.call(workerData, name)) {
      const data = workerData[name];
      if (isSharedPythonObject(data)) {
        workerData[name] = wrap(new PythonObject(data.ownershipId));
        sharedPythonObjectMaps.push(workerData[name]);
      }
    }
  }
  process.on('exit', () => {
    // fired when the thread exits.
    for (let o of sharedPythonObjectMaps) {
      o[NODE_PYTHON_HANDLE_NAME].returnOwnership();
    }
  });
}

module.exports = {
  SharedPythonObject,
};
