import Fastify from 'fastify';
import path from 'path';
import ora from 'ora';
import childProcess from 'child_process';
import { constants } from '@pipcook/pipcook-core';

import { ServeHandler, PredictHandler } from '../types';

const fastify = Fastify({ logger: true });
const spinner = ora();
const { PIPCOOK_LOGS } = constants;

export const serve: ServeHandler = async function(jobId, port = 7682) {
  let predictHandler: PredictHandler;
  try {
    predictHandler = require(path.join(PIPCOOK_LOGS, jobId, 'deploy', 'main.js'));
  } catch (err) {
    spinner.fail(`the path specified is not a valid pipcook deploy path`);
    return process.exit(1);
  }

  childProcess.execSync('npm install', {
    cwd: path.join(PIPCOOK_LOGS, jobId, 'deploy'),
    stdio: 'inherit'
  });

  fastify.post('/', async (req) => {
    const result = await predictHandler(req.body.data);
    return {
      result: result
    };
  });

  const start = async () => {
    try {
      await fastify.listen(port);
      console.log(`predict server is starting. Please send POST HTTP request to ${port}`);
    } catch (err) {
      return process.exit(1);
    }
  };
  start();
};
