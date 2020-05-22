import ora from 'ora';
import { exec } from 'child_process';
import { CommandHandler } from "../types/handler";

const spinner = ora();

export const bip: CommandHandler = async () => {
  exec(`./node_modules/.bin/bip ${process.argv.slice(3).join(' ')}`, {
    cwd: process.cwd()
  }, (err, stdout, stderr) => {
    if (err) {
      spinner.fail(`Exec bip error: ${stderr}`);
      throw err;
    } else {
      spinner.succeed(stdout);
    }
  });
};
