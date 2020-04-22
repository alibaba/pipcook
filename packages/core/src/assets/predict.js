const modelDefine = require('./modelDefine').default;
const fastify = require('fastify')({ logger: true });
const log = require('./log.json');

let dataProcess;
const dataProcessLog = log.components.find(e => e.type === 'dataProcess');
if (dataProcessLog) {
  dataProcess = require('./dataProcess').default;
}

async function predict() {
  const model = await modelDefine(null, {
    recoverPath: __dirname
  })

  fastify.post('/', async (req) => {
    const sample = {
      data: req.body.data,
      label: null
    }
    if (dataProcess) {
      await dataProcess(sample, {}, dataProcessLog.params);
    }
    const result = await model.predict(sample);
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

predict();