const chalk = require('chalk');
const {startBoard} = require('@pipcook/pipcook-core')
/**
 *  start pipcook board
 */
const board = async () => {
  try {
    startBoard();
  } catch (error) {
    console.log(
      chalk.red(
        error
      )
    );
  }
};

module.exports = board;