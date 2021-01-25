const test = require('ava');
const path = require('path');
const boa = require('../../');
const os = boa.import('os');

test('os/process parameters', t => {
  console.log(`os.ctermid() is ${os.ctermid()}`);
  console.log(`os.environ is ${os.environ}`);
  console.log(`os.environb is ${os.environb}`);
  console.log(`os.getcwd() is ${os.getcwd()}`);
  console.log(`os.fspath() is ${os.fspath('./test')}`);
  console.log(`os.getenv() is ${os.getenv('USER')}`);
  console.log(`os.getegid() is ${os.getegid()}`);
  console.log(`os.geteuid() is ${os.geteuid()}`);
  console.log(`os.getgroups() is ${os.getgroups()}`);
  console.log(`os.getpid() is ${os.getpid()}`);
  t.pass();
});

test('os/files and directories', t => {
  console.log(`os.access() is ${os.access('./os.js', 0x777)}`);
  console.log(`os.getcwd() is ${os.getcwd()}`);
  console.log(`os.listdir() is ${os.listdir('./')}`);
  console.log(`${os.listdir('./')[0]}`);
  console.log(os.listdir('./')[0]);

  // makedirs and rmdir
  {
    const dirPath = path.join(__dirname, '../.testdir');
    os.makedirs(dirPath, boa.kwargs({ mode: 0x777, exist_ok: false }));
    os.rmdir(dirPath);
  }
  t.pass();
});
