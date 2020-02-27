const chalk = require('chalk');
const {startBoard} = require('@pipcook/pipcook-core');

module.exports = function() {
  try {
    startBoard();
  } catch (e) {
    console.error(chalk.red(e));
  }
};
