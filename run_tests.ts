Error.stackTraceLimit = Infinity;
const JasmineCtor = require('jasmine');
const { SpecReporter } = require('jasmine-spec-reporter');

const cwdIndex = process.argv.indexOf('--cwd');
let cwd: string;
if (cwdIndex != -1) {
  cwd = process.argv[cwdIndex + 1];
  if (cwd) {
    process.chdir(cwd);
  }
}
process.env.NODE_ENV = 'test';
process.on('unhandledRejection', (e) => {
  throw e;
});

const runner = new JasmineCtor();
runner.loadConfig({
  spec_files: [ 'src/**/*_test.ts', 'tests/*.ts' ],
  random: false
});
runner.clearReporters();
runner.addReporter(new SpecReporter());
runner.execute();
