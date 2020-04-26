import chalk from 'chalk';
import { readFileSync } from 'fs-extra';
import path from 'path';
import { pipcookLogName } from './config';
import glob from 'glob-promise';

import { CMDHandler } from '../types';

export const log: CMDHandler = async () => {
  const logDir = path.join(process.cwd(), pipcookLogName);
  try {
    const files = await glob(path.join(logDir, '*', 'log.json'));
    const jsonObject = files.map((file) => {
      try {
        const json = readFileSync(file).toString();
        const jsonObj = JSON.parse(json);
        let timestamp = jsonObj.pipelineId.split('-');
        timestamp = new Date(Number(timestamp[timestamp.length - 1])).toLocaleString();
        return {
          pipelineId: jsonObj.pipelineId,
          success: jsonObj.error ? 'no' : 'yes',
          evaluation: jsonObj.latestEvaluateResult ? JSON.stringify(jsonObj.latestEvaluateResult) : '',
          time: timestamp
        };
      } catch (e) {
        return false;
      }
    });
    console.table(jsonObject);
  } catch (error) {
    console.log(
      chalk.red(
        error
      )
    );
  }
};
