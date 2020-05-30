Error.stackTraceLimit = Infinity;
const jasmineCtor = require('jasmine');
const { SpecReporter } = require('jasmine-spec-reporter');

process.on('unhandledRejection', (e) => {
  throw e;
});

const runner = new jasmineCtor();
runner.loadConfig({
  spec_files: [ 'src/**/*_test.ts' ],
  random: false
});
runner.clearReporters();
runner.addReporter(new SpecReporter());
runner.execute();
