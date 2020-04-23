const fastify = require('fastify')({ logger: true });
const path = require('path');
const ora = require('ora');
const childProcess = require('child_process');

const spinner = ora();
function serve(deployPath) {
  let predictFunc;
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
      await fastify.listen(7687);
      console.log('predict server is starting. Please send POST HTTP request to 7687');
    } catch (err) {
      process.exit(1);
    }
  };
  start();
}

module.exports = serve;
