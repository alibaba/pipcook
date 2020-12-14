import { GenerateOptions } from '../service/pipeline';
import * as fs from 'fs-extra';
import { JobEntity } from '../model/job';
import * as path from 'path';

export function nodejsGenerator(job: JobEntity, projPackage: any, dist: string, opts: GenerateOptions) {
  projPackage.dependencies = {
    [opts.plugins.modelDefine.name]: opts.plugins.modelDefine.version,
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
    output: job,
  };

  const filePromise = [
    // copy base components
    fs.copy(opts.modelPath, dist + '/nodejs/model'),
    fs.copy(path.join(__dirname, `../../templates/node/predict.js`), `${dist}/nodejs/index.js`),
    fs.copy(path.join(__dirname, '../../templates/boapkg.js'), `${dist}/nodejs/boapkg.js`),
    // write package.json
    fs.outputJSON(dist + '/nodejs/package.json', projPackage, jsonWriteOpts),
    // write metadata.json
    fs.outputJSON(dist + '/nodejs/metadata.json', metadata, jsonWriteOpts),
  ];

  return filePromise;
}
