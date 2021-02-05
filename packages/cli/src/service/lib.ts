import { CommonOptions } from '../types/options';
import { initClient, logger } from '../utils/common';

const supportDeps = [ 'tensorflow', 'tvm' ];

/**
 * Add missing lib
 */
export async function addLib(libName: string, opts: CommonOptions): Promise<void> {
  const client = initClient(opts.hostIp, opts.port);
  if (supportDeps.includes(libName)) {
    const ret = await client.lib.install(libName);
    if (ret) {
      logger.success(`${libName} installed successfully`);
    } else {
      logger.fail(`Failed to install ${libName}`);
    }
  } else {
    logger.fail(`You are trying install ${name}, while it is not supported at this time`);
  }
}
