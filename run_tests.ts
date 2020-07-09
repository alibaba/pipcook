Error.stackTraceLimit = Infinity;
const JasmineCtor = require('jasmine');
const { SpecReporter } = require('jasmine-spec-reporter');

process.env.NODE_ENV = 'test';
process.on('unhandledRejection', (e) => {
  throw e;
});

const runner = new JasmineCtor();
runner.loadConfig({
  spec_files: [ 'src/**/*_test.ts', 'test/**/*.ts' ],
  random: false
});
runner.clearReporters();
runner.addReporter(new SpecReporter());
runner.execute();
