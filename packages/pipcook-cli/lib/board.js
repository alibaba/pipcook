const chalk = require('chalk');
const fse = require('fs-extra');
const ora = require('ora');
const childProcess = require('child_process');
const path = require('path');

const spinner = ora();

module.exports = (type, pluginName) => {

  if (type === 'stop') {
    console.log('stop.........')
    childProcess.execSync(`cd .server && npm stop`, {
      cwd: process.cwd(),
      stdio: 'inherit'
    });
  } 
  else {
    try {
      fse.removeSync(path.join(process.cwd(), '.server', 'app', 'public', 'plugins'));
      if (pluginName) {
        let pluginPath = require.resolve(type, {
          paths: [path.join(process.cwd())]
        });
        pluginPath = path.join(pluginPath, '..');
        const configJson = fse.readJSONSync(path.join(pluginPath, 'config.json'));
        fse.copySync(path.join(pluginPath, 'build'), path.join(process.cwd(), '.server', 'app', 'public', 'plugins', configJson.pluginName));
      }
      if (!fse.existsSync(process.cwd(), '.server')) {
        spinner.fail('Please init the project firstly');
        return;
      }
  
      childProcess.execSync(`cd .server && npm start`, {
        cwd: process.cwd(),
        stdio: 'inherit'
      });
    
    } catch (e) {
      console.error(chalk.red(e));
    }
  }
 
};
