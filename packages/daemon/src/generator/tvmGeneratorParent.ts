import { fork } from 'child_process';
import { GenerateOptions } from '../service/pipeline';
import * as path from 'path';
import { existsSync } from 'fs-extra';

export function tvmGenerator(dist: string, projPackage: any, opts: GenerateOptions) {
  // only support keras for now; Other formats will be supported in the coming commits
  if (! existsSync(path.join(opts.modelPath, 'model.h5'))) return;
  return new Promise((resolve, reject) => {
    const client = fork(`${path.resolve(__dirname, 'tvmGenerator')}`, [JSON.stringify({
      dist,
      projPackage,
      opts
    }), 'keras']);

    client.on('message', () => resolve());
    client.on('error', () => reject());
  });
}
