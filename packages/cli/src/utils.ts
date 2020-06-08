import * as os from 'os';
import { exec, spawn, ChildProcess, ExecOptions, ExecException } from 'child_process';
import * as realOra from 'ora';

export const Constants = {
  PIPCOOK_HOME: `${os.homedir()}/.pipcook`
};

export function execAsync(cmd: string, opts?: ExecOptions): Promise<string> {
  return new Promise((resolve, reject): void => {
    exec(cmd, opts, (err: ExecException, stdout: string) => {
      err == null ? resolve(stdout) : reject(err);
    });
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

export function ora(opts?: realOra.Options) {
  return realOra({ stream: process.stdout, ...opts });
}
