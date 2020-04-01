/**
 * @file This file is for all loggers.
 */

import chalk from 'chalk';
import { PipcookRunner } from '../core/core';
import { PipcookComponentResult } from '../types/component';

enum LoggerColor {
  GREEN = 'green',
  CYAN = 'cyan',
  RED = 'red',
}

type LoggerFunction = (input: string) => void;

// TODO(Yorkie): support custom Console?
function createLogger(level: string, color: LoggerColor): LoggerFunction {
  return (input) => (console as any)[level](chalk[color](input));
}

export default class Logger {
  protected static log: LoggerFunction = createLogger('log', LoggerColor.GREEN);
  protected static info: LoggerFunction = createLogger('info', LoggerColor.CYAN);
  protected static error: LoggerFunction = createLogger('error', LoggerColor.RED);

  public static logStartExecution(pipline: PipcookRunner) {
    Logger.log(`start execution: \npipeline id: ${pipline.pipelineId}`);
  }
  public static logCurrentExecution(component: PipcookComponentResult, type = 'normal') {
    let msg = `current execution component: ${component.type}`;
    if (type === 'merge') {
      msg = 'in merge, ' + msg;
    }
    Logger.info(msg);
  }
  public static logError(errmsg: string | Error) {
    if (errmsg instanceof Error)
      errmsg = errmsg.stack;
    return Logger.error(errmsg);
  }
  public static logComplete() {
    return Logger.log('Pipline is completed.');
  }
}

export const logStartExecution = Logger.logStartExecution;
export const logCurrentExecution = Logger.logCurrentExecution;
export const logError = Logger.logError;
export const logComplete = Logger.logComplete;
