import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Check if the log dir path provided by user is valid
 * @param logDir : directory of log
 */
export function checkLogDir(logDir: string) {
  assert.ok(logDir, 'Please specify a valid directory for logs');
  if (!fs.existsSync(logDir)) {
    throw new Error('Please specify a valid directory');
  }
  return logDir;
}