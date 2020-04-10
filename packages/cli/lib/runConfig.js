const { PipcookRunner } = require('@pipcook/pipcook-core');

process.on('message', async (msg) => {
  const runner = new PipcookRunner();
  runner.runConfig(msg);
});
