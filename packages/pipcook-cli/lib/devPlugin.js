const fse = require('fs-extra');
const ora = require('ora');
const path = require('path');
const spinner = ora();

/**
 * prepare a working dir for developer to develop plugins
 */
const devPlugin = (cmdObj) => {
  const pluginType = cmdObj && cmdObj[0];

  if (!pluginType) {
    console.log('Please provide a plugin type');
    return;
  }

  let dirname;
  try {
    dirname = path.join(process.cwd(), 'template-plugin');
    if (fse.existsSync(dirname)) {
      spinner.fail(`a directory or file called 'template-plugin' already exists. Please use a new working directory`);
      return;
    }
    fse.ensureDirSync(path.join(dirname, 'src'));
    fse.copyFileSync(path.join(__dirname, '..', 'assets', 'pluginPackage', '.npmignore'), 
      path.join(dirname, '.npmignore'));
    fse.copyFileSync(path.join(__dirname, '..', 'assets', 'pluginPackage', 'package.json'), 
      path.join(dirname, 'package.json'));
    fse.copyFileSync(path.join(__dirname, '..', 'assets', 'pluginPackage', 'tsconfig.json'), 
      path.join(dirname, 'tsconfig.json'));
    fse.copyFileSync(path.join(__dirname, '..', 'assets', 'pluginPackage', 'src', `${pluginType}.ts`), 
      path.join(dirname, 'src', `index.ts`));
    console.log('success');
  } catch (error) {
    console.error(err);
    fse.removeSync(dirname);
  }
  
};

module.exports = devPlugin;