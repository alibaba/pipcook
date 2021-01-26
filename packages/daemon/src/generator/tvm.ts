import { fork } from 'child_process';
import { GenerateOptions } from '../services/interface';
import * as path from 'path';
import * as fs from 'fs-extra';

export async function generateTVM(dist: string, projPackage: any, opts: GenerateOptions): Promise<void> {
  const files = await fs.readdir(opts.modelPath);
  // exit if no h5 file in the folder
  if (files.filter((it) => it.endsWith('h5')).length) return;
  return new Promise((resolve, reject) => {
    const client = fork(`${path.resolve(__dirname, 'tvm.cli')}`, [ JSON.stringify({
      dist,
      projPackage,
      opts
    }), 'keras' ]);

    client.on('message', (msg) => {
      if (msg === 1) {
        resolve();
      } else {
        reject(new Error('Internal Error'));
      }
    });
    client.on('error', reject);
  });
}
