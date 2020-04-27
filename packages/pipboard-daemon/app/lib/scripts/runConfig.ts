import { PipcookRunner } from '@pipcook/pipcook-core';
const filename = process.argv[2];

process.on('unhandledRejection', (e) => {
  throw e;
});

const runner = new PipcookRunner();
runner.runConfig(filename);
