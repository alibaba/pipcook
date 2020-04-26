const fastify = require('fastify')({ logger: true });
const path = require('path');
const ora = require('ora');
const childProcess = require('child_process');

const spinner = ora();
function serve(dir, port = 7682) {
  let predictFunc;
  try {
    predictFunc = require(path.join(dir, 'main.js'));
  } catch (err) {
    spinner.fail(`the path specified is not a valid pipcook deploy path`);
    return;
  }

  childProcess.execSync('npm install', {
    cwd: dir,
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

module.exports = serve;
