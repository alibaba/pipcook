import { PIPCOOK_BOA } from '../constants';
import { execAsync, logger } from '../utils/common';

const supportDeps = [ 'tensorflow', 'tvm' ];

/**
 * Add missing deps
 */
const add = async () => {
  if (process.argv.length !== 4) { return; }
  const name = process.argv[3];
  if (supportDeps.includes(name)) {
    if (name === 'tvm') {
      logger.info('Installing tvm ...');
      await execAsync(`node ${PIPCOOK_BOA}/tools/bip.js install tlcpack -f https://tlcpack.ai/wheels`);
    } else {
      await execAsync(`node ${PIPCOOK_BOA}/tools/bip.js install ${name}`);
    }
  } else {
    console.warn(`You are trying install ${name}, while it is not supported at this time`);
  }
};

export default add;
