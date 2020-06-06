import Fastify from 'fastify';
import path from 'path';
import ora from 'ora';
import childProcess from 'child_process';
import { ServeHandler, PredictHandler } from '../types';

const fastify = Fastify({ logger: true });
const spinner = ora();

const serve: ServeHandler = async function serve(dir, { port = 7682 }) {
  let predictFn: PredictHandler;
  const model = path.join(process.cwd(), dir);
  try {
    predictFn = require(model);
  } catch (err) {
    spinner.fail(`the path specified is not a valid pipcook deploy path`);
    return process.exit(1);
  }
  childProcess.execSync('npm install', {
    cwd: model,
    stdio: 'inherit'
  });

  fastify.post('/', async (req) => {
    const result = await predictFn(req.body.data);
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

export default serve;
