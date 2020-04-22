// set debug environment variables
process.env.DEBUG = 'cli::*';

const debug = require('debug');

const cookLog = {
  debugLog: (...log) => {
    const createDebug = debug('cli::log');
    createDebug(...log);
  },
  debugError: (...log) => {
    const createDebug = debug('cli::warning');
    createDebug(...log);
  },
  debugWarning: (log) => {
    const createDebug = debug('cli::error');
    createDebug(...log);
  },
  debugTable: (log) => {
    const createDebug = debug('cli::table');
    createDebug('⬇︎⬇︎⬇︎');
    console.table(log);
  }
};

module.exports = cookLog;
