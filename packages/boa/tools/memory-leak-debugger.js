'use strict';

const v8 = require('v8');
const boa = require('../');
const np = boa.import('numpy');

let firstTime = 0;
v8.writeHeapSnapshot('./mlstep0.heapsnapshot');
setInterval(() => {
  if (firstTime === 0) {
    v8.writeHeapSnapshot('./mlstep1.heapsnapshot');
    firstTime = 1;
  }
  // do some works
  np.arange(0);
}, 100);

process.on('SIGINT', () => {
  v8.writeHeapSnapshot('./mlstep2.heapsnapshot');
  console.log('dump done');
  process.nextTick(() => process.exit());
});
