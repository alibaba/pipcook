const { PipcookRunner } = require('@pipcook/pipcook-core');
const filename = process.argv[2];

if (!filename) {
  throw new TypeError('must specify the filename.');
}
process.on('unhandledRejection', (e) => {
  throw e;
});

const runner = new PipcookRunner();
runner.runConfig(filename);
