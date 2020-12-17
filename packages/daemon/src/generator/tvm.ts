import { fork } from 'child_process';
import { GenerateOptions } from '../service/pipeline';
import * as path from 'path';
import * as fs from 'fs';

export function generateTVM(dist: string, projPackage: any, opts: GenerateOptions) {
  // only support keras for now; Other formats will be supported in the coming commits
  try {
    fs.access(path.join(opts.modelPath, 'model.h5'), fs.constants.F_OK, (err) => {
      if (err) { return ; }
    });
  } catch {
    return ;
  }
  return new Promise((resolve, reject) => {
    const client = fork(`${path.resolve(__dirname, 'tvm.cli')}`, [JSON.stringify({
      dist,
      projPackage,
      opts
    }), 'keras']);

    client.on('message', () => resolve({}));
    client.on('error', () => reject());
  });
}
