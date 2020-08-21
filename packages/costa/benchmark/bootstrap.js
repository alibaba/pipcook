'use strict';

const { join } = require('path');
const { CostaRuntime } = require('../dist/src/runtime');
const { PluginRunnable } = require('../dist/src/runnable');

const costa = new CostaRuntime({
  installDir: join(__dirname, '../.tests/plugins'),
  datasetDir: join(__dirname, '../.tests/datasets'),
  componentDir: join(__dirname, '../.tests/components'),
  npmRegistryPrefix: 'https://registry.npmjs.com/'
});
const r = new PluginRunnable(costa);

(async () => {
  await r.bootstrap({});
  r.destroy();
})();
