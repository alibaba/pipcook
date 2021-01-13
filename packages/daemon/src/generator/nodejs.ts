import { GenerateOptions } from '../services/interface';
import * as fs from 'fs-extra';
import { Job } from '../models/job.model';
import * as path from 'path';

export function generateNode(job: Job, projPackage: any, dist: string, opts: GenerateOptions): Array<Promise<any>> {
  projPackage.dependencies = {
    [opts.plugins.modelDefine.name]: opts.plugins.modelDefine.version
  };
  projPackage.scripts = {
    postinstall: 'node boapkg.js'
  };
  if (opts.plugins.dataProcess) {
    projPackage.dependencies[opts.plugins.dataProcess.name] = opts.plugins.dataProcess.version;
  }

  const jsonWriteOpts = { spaces: 2 } as fs.WriteOptions;
  const metadata = {
    pipeline: opts.pipeline,
    output: job
  };

  return [
    // copy base components
    fs.copy(opts.modelPath, dist + '/nodejs/model'),
    fs.copy(path.join(__dirname, `../../templates/node/predict.js`), `${dist}/nodejs/index.js`),
    fs.copy(path.join(__dirname, '../../templates/boapkg.js'), `${dist}/nodejs/boapkg.js`),
    // write package.json
    fs.outputJSON(dist + '/nodejs/package.json', projPackage, jsonWriteOpts),
    // write metadata.json
    fs.outputJSON(dist + '/nodejs/metadata.json', metadata, jsonWriteOpts)
  ];
}
