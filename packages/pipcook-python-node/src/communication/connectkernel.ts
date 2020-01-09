import * as childProcess from 'child_process';
import * as path from 'path';
const fs = require('fs-extra');
const ora = require('ora');
const spinner = ora();
const kill = require('kill-port');
const commandExistsSync = require('command-exists').sync;

/**
 * To start a ipyhton kernel. To successfully execute this function, python and pip are required.

 * @param shell_port shell port
 * @param iopub_port iopub port
 */
export function startKernel(shell_port: number, iopub_port: number) {
  const tempJson = `
    {
      "shell_port": ${shell_port},
      "iopub_port": ${iopub_port},
      "ip": "127.0.0.1",
      "key": "",
      "transport": "tcp",
      "signature_scheme": "hmac-sha256",
      "kernel_name": ""
    }
  `
  fs.outputFileSync(path.join(process.cwd(), '.temp', 'ipker.json'), tempJson);
  return new Promise((resolve, reject) => {
    const venvDir = fs.pathExistsSync(path.join(process.cwd(), 'pipcook_venv', 'bin', 'activate'));
    if (!venvDir) {
      fs.removeSync(path.join(process.cwd(), 'pipcook_venv'));
    }

    let pipCommand = 'pip';
    if (commandExistsSync('pip3')) {
      pipCommand = 'pip3';
    } else if (commandExistsSync('pip3.6')) {
      pipCommand = 'pip3.6';
    } else if (commandExistsSync('pip3.7')) {
      pipCommand = 'pip3.7';
    }

    // install virtualenv if it does not exist and meanwhile install ipython
    const output = childProcess.spawn(`${venvDir ? '' : `${pipCommand} install virtualenv && virtualenv --no-site-packages pipcook_venv && \\`} 
      . ${path.join(process.cwd(), 'pipcook_venv', 'bin', 'activate')} && pip install ipykernel==5.1.3 && kill $(lsof -t -i:${shell_port}) && kill $(lsof -t -i:${iopub_port}) `, [], {
        shell: true,
        cwd: process.cwd(),
      })
    
    output.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    output.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    output.on('close', (code) => {
      // start ipython kernel with specific port
      const child = childProcess.spawn(`. ${path.join(process.cwd(), 'pipcook_venv', 'bin', 'activate')} \\
      && ipython kernel --IPKernelApp.connection_file=${path.join(process.cwd(), '.temp', 'ipker.json')}`, [], {
        shell: true,
        cwd: process.cwd(),
      });

      child.stdout.on('data', (data) => {
        console.log(data.toString());
        if (data.toString().includes('To connect another client to this kernel')) {
          resolve({
            cleanup: async () => {
              await kill(shell_port, 'tcp');
              await kill(iopub_port, 'tcp');
            }
          });
        }
      });
      
      child.stderr.on('data', (data) => {
        console.error(data.toString());
      });

      child.on('close', (code) => {
        reject(code);
      })
    });

    // timeout after 15 mins
    setTimeout(() => {
      reject(new Error('timeout'))
    }, 900000)
  })
  
} 