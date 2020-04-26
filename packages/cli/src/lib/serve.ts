import getGastify from 'fastify';
import path from 'path';
import ora from 'ora';
import childProcess from 'child_process';

import { ServeHandler, PredictFunc } from '../types';

const fastify = getGastify({ logger: true });
const spinner = ora();

export const serve: ServeHandler = async (deployPath, port) => {
  if (!port) {
    port = 7682;
  }
  let predictFunc: PredictFunc;
  try {
    predictFunc = require(path.join(deployPath, 'main.js'));
  } catch (err) {
    spinner.fail(`the path specified is not a valid pipcook deploy path`);
    return;
  }

  childProcess.execSync(`npm install`, {
    cwd: deployPath,
    stdio: 'inherit'
  });

  fastify.post('/', async (req) => {
    const result = await predictFunc(req.body.data);
    return {
      result: result
    };
  });

  const start = async () => {
    try {
      await fastify.listen(port);
      console.log(`predict server is starting. Please send POST HTTP request to ${port}`);
    } catch (err) {
      process.exit(1);
    }
  };
  start();
}
