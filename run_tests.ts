Error.stackTraceLimit = Infinity;
const jasmineCtor = require('jasmine');

process.on('unhandledRejection', (e) => {
  throw e;
});

const runner = new jasmineCtor();
runner.loadConfig({
  spec_files: [ 'src/**/*_test.ts' ],
  random: false
});
runner.execute();
