const chalk = require('chalk');
const fse = require('fs-extra');
const childProcess = require('child_process');
const ora = require('ora');
const path = require('path');
const {pipcookLogName} = require('./config');
const spinner = ora();
const glob = require('glob-promise');
const cTable = require('console.table');
/**
 * install all dependencies of pipcook into working dir
 */
const log = async () => {
  const logDir = path.join(process.cwd(), pipcookLogName);
  try {
    const files = await glob(path.join(logDir, 'logs' ,'pipcook-pipeline-*.json'));
    const jsonObject = files.map((file) => {
      try {
        const json = fse.readFileSync(file);
        const jsonObj = JSON.parse(json);
        let timestamp = jsonObj.pipelineId.split('-');
        timestamp = new Date(Number(timestamp[timestamp.length - 1])).toLocaleString();
        return {
          pipelineId: jsonObj.pipelineId,
          pipelineName: jsonObj.pipelineName,
          success: jsonObj.error ? 'no' : 'yes',
          evaluation: jsonObj.latestEvaluateResult ? JSON.stringify(jsonObj.latestEvaluateResult) : '',
          time: timestamp,
        }
      } catch (e) {
        return false
      }
    })
    console.table(jsonObject);
  } catch (error) {
    console.log(
      chalk.red(
        error
      )
    );
  }
};

module.exports = log;