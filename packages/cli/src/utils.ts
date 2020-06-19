import * as os from 'os';
import * as url from 'url';
import {
  exec,
  spawn,
  ChildProcess,
  ExecOptions,
  SpawnOptions,
  ExecException
} from 'child_process';
import { pathExists } from 'fs-extra';
import path from 'path';
import realOra = require("ora");

export const Constants = {
  PIPCOOK_HOME: `${os.homedir()}/.pipcook`,
  BOA_CONDA_INDEX: 'https://pypi.tuna.tsinghua.edu.cn/simple',
  BOA_CONDA_MIRROR: 'https://mirrors.tuna.tsinghua.edu.cn/anaconda/miniconda'
};
export const cwd = process.cwd;

export function execAsync(cmd: string, opts?: ExecOptions): Promise<string> {
  return new Promise((resolve, reject): void => {
    exec(cmd, opts, (err: ExecException, stdout: string) => {
      err == null ? resolve(stdout) : reject(err);
    });
  });
}

export function execNpm(subcmd: string, flags?: string, opts?: SpawnOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const cli = spawn('npm', [ subcmd, flags ], {
      stdio: 'inherit',
      env: process.env,
      ...opts
    });
    cli.on('exit', resolve);
    cli.on('error', reject);
  });
}

export function tail(id: string, name: string): ChildProcess {
  return spawn('tail',
    [
      '-f',
      `${Constants.PIPCOOK_HOME}/components/${id}/logs/${name}.log`
    ],
    {
      stdio: 'inherit'
    }
  );
}

export async function parseConfigFilename(filename: string): Promise<string> {
  if (!filename) {
    throw new TypeError('Please specify the config path');
  }
  let urlObj = url.parse(filename);
  // file default if the protocol is null
  if (urlObj.protocol == null) {
    filename = path.isAbsolute(filename) ? filename : path.join(process.cwd(), filename);
    // check the filename existence
    if (!await pathExists(filename)) {
      throw new TypeError(`${filename} not exists`);
    } else {
      filename = url.parse(`file://${filename}`).href;
    }
  } else if ([ 'http:', 'https:' ].indexOf(urlObj.protocol) === -1) {
    throw new TypeError(`protocol ${urlObj.protocol} is not supported`);
  }
  return filename;
}

export function ora(opts?: realOra.Options) {
  return realOra({ stream: process.stdout, ...opts });
}
