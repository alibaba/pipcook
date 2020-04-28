import Fastify from 'fastify';
import path from 'path';
import ora from 'ora';
import childProcess from 'child_process';

import { ServeHandler, PredictHandler } from '../types';

const fastify = Fastify({ logger: true });
const spinner = ora();

export const serve: ServeHandler = async function(dir, port = 7682) {
  let predictHandler: PredictHandler;
  try {
    predictHandler = require(path.join(dir, 'main.js'));
  } catch (err) {
    spinner.fail(`the path specified is not a valid pipcook deploy path`);
    return;
  }

  childProcess.execSync('npm install', {
    cwd: dir,
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
      process.exit(1);
    }
  };
  start();
};
