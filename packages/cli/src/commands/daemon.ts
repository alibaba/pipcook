import { spawn } from 'child_process';
import * as os from 'os';
import * as fs from 'fs-extra';
import path from 'path';
import find from 'find-process';
import ora from 'ora';

const spinner = ora();

export const daemon = async (operation: string) => {
  let pid: number;
  try {
    const pidFilePath = path.join(os.homedir(), '.pipcook', 'daemon', 'pid.txt');
    pid = parseInt(await fs.readFile(pidFilePath, 'utf8'));
  } finally {
    if (operation === 'start') {
      if (pid) {
        const pidInfo = await find('pid', pid);
        if (pidInfo && pidInfo.length > 0) {
          spinner.fail('Daemon is already running');
          process.exit(1);
        }
      } 
      const daemonProcess = spawn('npm', [ 'run', 'dev' ], {
        cwd: path.join(os.homedir(), '.pipcook', '.server')
      });
      await fs.outputFile(path.join(os.homedir(), '.pipcook', 'daemon', 'pid.txt'), String(daemonProcess.pid));
  
      daemonProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });
  
      daemonProcess.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
      });
    } else if (operation === 'stop'){
      if (pid) {
        process.kill(pid);
      }
      spinner.succeed('Daemon is stopped');
    }
  }
};
