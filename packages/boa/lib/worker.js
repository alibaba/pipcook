'use strict';

const { isMainThread, workerData } = require('worker_threads');
const { PythonObject, NODE_PYTHON_HANDLE_NAME } = require('bindings')('boa');
const { wrap } = require('./proxy');

const TYPE_ID = 'SHARED_PYTHON_OBJECT_TYPE';

/**
 * This is a wrapper for shared Python object, just like
 * v8's `SharedArrayBuffer`.
 */
class SharedPythonObject {
  constructor(o) {
    if (!isMainThread) {
      throw TypeError('SharedPythonObject must be used in main thread.');
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
    const data = workerData[name];
    if (isSharedPythonObject(data)) {
      workerData[name] = wrap(new PythonObject(data.ownershipId));
      sharedPythonObjectMaps.push(workerData[name]);
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
