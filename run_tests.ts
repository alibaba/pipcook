Error.stackTraceLimit = Infinity;
const JasmineCtor = require('jasmine');
const { SpecReporter } = require('jasmine-spec-reporter');

process.env.NODE_ENV = 'test';
process.on('unhandledRejection', (e) => {
  throw e;
});

let spec: string[] = undefined;
const indexSpec = process.argv.indexOf('--spec');
if (indexSpec !== -1 && process.argv[indexSpec + 1]) {
  spec = [ process.argv[indexSpec + 1] ];
}
const runner = new JasmineCtor();
runner.loadConfig({
  spec_files: spec || [ 'src/**/*_test.ts', 'test/**/job.ts' ],
  random: false
});
runner.clearReporters();
runner.addReporter(new SpecReporter());
runner.execute();
