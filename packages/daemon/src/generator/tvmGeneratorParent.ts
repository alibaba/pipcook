import { fork } from 'child_process';
import { GenerateOptions } from '../service/pipeline';
import * as path from 'path';

export function tvmGenerator(dist: string, projPackage: any, opts: GenerateOptions) {
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
