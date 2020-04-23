const modelDefine = require('./modelDefine').default;
const log = require('./log.json');

let dataProcess, model;
const dataProcessLog = log.components.find((e) => e.type === 'dataProcess');
if (dataProcessLog) {
  dataProcess = require('./dataProcess').default;
}

async function predict(data) {
  if (!model) {
    model = await modelDefine(null, {
      recoverPath: __dirname
    });
  }
  const sample = {
    data,
    label: null
  };
  if (dataProcess) {
    await dataProcess(sample, {}, dataProcessLog.params);
  }
  const result = await model.predict(sample);
  return result;
}

module.exports = predict;
