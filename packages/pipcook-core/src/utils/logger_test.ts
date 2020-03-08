import logger from './logger';
import {PipcookRunner} from '../core/core';
import {PipcookComponentResult} from '../types/component';

describe('logger', () => {
  it('should log "start"', () => {
    const runner = {
      pipelineId: '433'
    };
    logger.logStartExecution(runner as PipcookRunner);
  });
  it('should log current execution in nomal', () => {
    const compRes = {
      type: 'example'
    };
    logger.logCurrentExecution(compRes as PipcookComponentResult);
    logger.logCurrentExecution(compRes as PipcookComponentResult, 'merge');
  })
  it('should log "error"', () => {
    logger.logError('temp error message');
    logger.logError(new Error('temp error'));
  });
  it('should log "complete"', () => {
    logger.logComplete()
  });
});
