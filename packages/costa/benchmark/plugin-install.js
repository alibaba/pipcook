'use strict';

const { join } = require('path');
const { CostaRuntime } = require('../dist/src/runtime');

const costa = new CostaRuntime({
  installDir: join(__dirname, '../.tests/plugins'),
  datasetDir: join(__dirname, '../.tests/datasets'),
  componentDir: join(__dirname, '../.tests/components'),
  npmRegistryPrefix: 'https://registry.npmjs.com/'
});

(async () => {
  const pkg = await costa.fetch('@pipcook/plugins-tensorflow-resnet-model-define');
  await costa.install(pkg, process);
})();
