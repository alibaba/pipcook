/**
 * @file This file is for all loggers.
 */
import {PipcookRunner} from '../core/core'; 
import chalk from 'chalk';
import {PipcookComponentResult} from '../types/component';
const log = console.log;

export function logStartExecution(pipcookRunner: PipcookRunner) {
  log(chalk.green(`Start Execution: \n Pipeline Id: ${pipcookRunner.pipelineId}`))
}

export function logCurrentExecution(component: PipcookComponentResult, type='normal') {
  if (type === 'normal') {
    log(chalk.cyan(`Current Execution Component: ${component.type}`))
  } else if (type === 'merge') {
    log(chalk.cyan(`In Merge, Current Execution Component: ${component.type}`))
  }
  
}

export function logError(error: any) {
  log(chalk.red(error));
}

export function logComplete() {
  log(chalk.green('Pipcook running is completed.'));
}