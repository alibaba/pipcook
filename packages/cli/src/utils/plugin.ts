import * as fs from 'fs-extra';
import * as path from 'path';
import { execAsync } from './';

export async function install(name: string, pluginDir: string): Promise<string> {
  if (!await fs.pathExists(pluginDir)) {
    await fs.mkdirp(pluginDir);
  }
  const pkgPath = path.join(pluginDir, 'package.json');
  const requirePath = path.join(pluginDir, 'node_modules', name);
  if (!await fs.pathExists(pkgPath)) {
    await execAsync(`npm init -y`, { cwd: pluginDir });
    await execAsync(`npm install ${name} --only=prod`, { cwd: pluginDir });
  } else {
    const pkg = await fs.readJson(pkgPath);
    if (pkg?.dependencies[name]) {
      return requirePath;
    }
  }
  await execAsync(`npm install ${name} --only=prod`, { cwd: pluginDir });
  return requirePath;
}
