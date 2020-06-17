import { pathExistsSync, readJSONSync } from 'fs-extra';
import { join } from 'path';

const { cwd } = process;
const APP_MANIFEST = join(cwd(), '.pipcook/manifest.json');
let executable = false;
let manifest = null;

if (pathExistsSync(APP_MANIFEST)) {
  manifest = readJSONSync(APP_MANIFEST);
  if (manifest.executable === true) {
    executable = true;
  }
}

export {
  executable,
  manifest
};
