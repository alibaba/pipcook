const spawnSync = require('child_process').spawnSync;
const path = require('path');
const homedir = require('os').homedir;
const fs = require('fs-extra');

const { join, dirname } = path;
const { mkdirp, stat, readJson, writeJson, remove, pathExists, symlink } = fs;
const config = require('./config.json');

const PIPCOOK_HOME_PATH = join(homedir(), '.pipcook');

async function installPkg(pkgDir, nodeModules, force) {
  console.log(`install ${pkgDir} to ${nodeModules} with ${force ? 'force' : 'no-force'}`);
  const packageFile = join(pkgDir, 'package.json');
  if (await pathExists(pkgDir)
    && (await stat(pkgDir)).isDirectory()
    && await pathExists(packageFile)
    && !(await stat(packageFile)).isDirectory()) {
    const pkg = await readJson(packageFile);
    if (await pathExists(join(nodeModules, pkg.name))) {
      if (!force) {
        return console.warn(`path ${pkgDir} exists, ignore`);
      }
      await remove(join(nodeModules, pkg.name));
    }
    await mkdirp(dirname(join(nodeModules, pkg.name)));
    await symlink(pkgDir, join(nodeModules, pkg.name));
    return { name: pkg.name, version: pkg.version };
  }
}

async function init (projDir, pkgList, force) {
  await mkdirp(projDir);
  const projPackageFile = join(projDir, 'package.json');
  if (!await pathExists(projPackageFile)) {
    console.log(`init project ${projDir}`);
    spawnSync('npm', [ 'init', '-y' ], { cwd: projDir });
  }
  const pkgNameList = [];
  const projPkg = await readJson(projPackageFile);
  for (const pkg of pkgList) {
    const dependecyInfo = await installPkg(
      join(__dirname, '../packages', pkg),
      join(projDir, 'node_modules'),
      force
    );
    if (dependecyInfo) {
      pkgNameList.push(dependecyInfo);
    }
  }
  if (typeof projPkg.dependencies !== 'object') {
    projPkg.dependencies = {};
  }
  pkgNameList.forEach((item) => {
    projPkg.dependencies[item.name] = item.version;
  });
  await writeJson(projPackageFile, projPkg, { spaces: 2 });
}

let force = false;
if (process.argv.length > 2 && process.argv[2] === '-f') {
  force = true;
}

const futures = [];
for (const key in config) {
  if (Array.isArray(config[key])) {
    futures.push(init(join(PIPCOOK_HOME_PATH, key), config[key], force));
  }
}

Promise.all(futures).then(() => {
  console.log('init finished');
})
