const fse = require('fs-extra');
const ora = require('ora');
const path = require('path');
const spinner = ora();

/**
 * prepare a working dir for developer to develop plugins
 */
const devPlugin = (cmdObj) => {
  const pluginType = cmdObj && cmdObj[0];
  let projectName = cmdObj && cmdObj[1];

  if (!pluginType) {
    console.log('Please provide a plugin type');
    return;
  }

  let dirname;
  try {
    const typeFiles = fse.readdirSync(path.join(__dirname, '../assets/pluginPackage/src'));
    const allowedTypes = typeFiles.map(filename => filename.replace(/(.*\/)*([^.]+).*/ig,"$2"));
    if (allowedTypes.indexOf(pluginType) < 0) {
      console.log(`Unsupported plugin type: ${pluginType}.\n` +
        `The type of plugin must be one of: \n{ ${allowedTypes.join(', ')} }`);
      return;
    }

    if (!projectName) {
      projectName = 'template-plugin';
    }

    dirname = path.join(process.cwd(), projectName);
    if (fse.existsSync(dirname)) {
      spinner.fail(`a directory or file called ${projectName} already exists. Please use a new working directory`);
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
  } catch (e) {
    console.error(e);
    fse.removeSync(dirname);
  }
};

module.exports = devPlugin;
