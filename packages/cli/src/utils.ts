import * as os from 'os';
import { exec, ExecOptions, ExecException } from 'child_process';

export const Constants = {
  PIPCOOK_HOME: `${os.homedir()}/.pipcook`
};

export function execAsync(cmd: string, opts?: ExecOptions): Promise<string> {
  return new Promise((resolve, reject): void => {
    exec(cmd, opts, (err: ExecException, stdout: string, stderr: string) => {
      err == null ? resolve(stdout) : reject(err);
    });
  });
}
